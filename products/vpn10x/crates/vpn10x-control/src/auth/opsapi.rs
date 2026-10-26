//! Signing in with an OpsAPI account (ADR-0004).
//!
//! OpsAPI tokens are HS256 under a secret this process must never hold
//! (ADR-0003), so they are never verified here. Each one is handed back to the
//! service that issued it, and the answer is checked twice, from two
//! directions:
//!
//! 1. `GET /auth/me` with the person's token. OpsAPI says whose live session it
//!    is and which workspaces they are an active member of. A token it does not
//!    recognise, or a person outside the configured workspace, stops here —
//!    OpsAPI has open sign-up, so an account on its own is not membership.
//! 2. `GET /scim/v2/Users/{uuid}` with this deployment's own `opsk_` key. The
//!    directory, asked independently of anything the client presented, must
//!    agree the person exists and is active.
//!
//! When `allowed_roles` is set there is a third question (ADR-0005):
//! `GET /api/v2/user/{uuid}/namespace-memberships`, asked with the person's
//! token at sign-in and with our key on every connect, must show them holding
//! one of those roles in the configured workspace. `/auth/me` cannot answer
//! it — it lists workspaces without the roles held in them.
//!
//! The person is then bound by OpsAPI's uuid, never by email. OpsAPI does not
//! require a verified address to register, so "an OpsAPI account carrying
//! alice's email" is not alice: a first sign-in only ever finds a user OpsAPI
//! itself provisioned under that uuid (`users.external_id`), or — under `jit`
//! admission, and only when no user has that email — creates one.
//!
//! The person's OpsAPI token is used for those requests and dropped. It is not
//! stored, logged, or sent anywhere but back to OpsAPI.

use crate::auth::oidc::{mint_access_token, TokenResponse};
use crate::config::{OpsApiConfig, Provisioning};
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;
use uuid::Uuid;

/// How long to wait on OpsAPI. Sign-in and connect are interactive; a hung
/// directory should fail the request, not the person's patience.
const TIMEOUT: Duration = Duration::from_secs(10);

/// The issuer recorded in `oidc_identities` for OpsAPI bindings. Includes the
/// URL, so pointing a deployment at a different OpsAPI cannot reuse bindings
/// made against the old one.
pub fn issuer(config: &OpsApiConfig) -> String {
    format!("opsapi:{}", config.url.trim_end_matches('/'))
}

fn endpoint(config: &OpsApiConfig, path: &str) -> String {
    format!("{}{path}", config.url.trim_end_matches('/'))
}

/// Who OpsAPI says a session belongs to.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OpsApiPerson {
    pub uuid: String,
    pub email: String,
    pub display_name: Option<String>,
}

#[derive(Deserialize)]
struct MeResponse {
    user: MeUser,
    #[serde(default)]
    namespaces: Vec<MeNamespace>,
}

#[derive(Deserialize)]
struct MeUser {
    uuid: String,
    email: String,
    #[serde(default)]
    active: Option<bool>,
    #[serde(default)]
    first_name: Option<String>,
    #[serde(default)]
    last_name: Option<String>,
}

#[derive(Deserialize)]
struct MeNamespace {
    slug: String,
    #[serde(default)]
    member_status: Option<String>,
    #[serde(default)]
    status: Option<String>,
}

#[derive(Deserialize)]
struct ScimUser {
    #[serde(default)]
    email: Option<String>,
    #[serde(default)]
    active: Option<bool>,
}

fn unreachable(err: reqwest::Error) -> AppError {
    AppError::Unavailable(format!("OpsAPI could not be reached: {err}"))
}

/// Step 1: ask OpsAPI whose session `token` is, and check membership.
async fn whose_session(
    state: &AppState,
    config: &OpsApiConfig,
    token: &str,
) -> AppResult<OpsApiPerson> {
    let response = state
        .http
        .get(endpoint(config, "/auth/me"))
        .bearer_auth(token)
        .timeout(TIMEOUT)
        .send()
        .await
        .map_err(unreachable)?;
    let status = response.status();
    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
        tracing::warn!("denied: OpsAPI did not recognise the session");
        return Err(AppError::Unauthorized);
    }
    if !status.is_success() {
        return Err(AppError::Unavailable(format!(
            "OpsAPI /auth/me answered {status}"
        )));
    }
    let me: MeResponse = response.json().await.map_err(unreachable)?;

    if me.user.active == Some(false) {
        tracing::warn!(opsapi_user = %me.user.uuid, "denied: OpsAPI account is deactivated");
        return Err(AppError::Unauthorized);
    }
    // OpsAPI only lists active memberships of active workspaces today; the
    // status fields are checked as well so that a change there cannot quietly
    // widen who gets in.
    let member = me.namespaces.iter().any(|ns| {
        ns.slug.eq_ignore_ascii_case(&config.namespace)
            && ns.member_status.as_deref().is_none_or(|s| s == "active")
            && ns.status.as_deref().is_none_or(|s| s == "active")
    });
    if !member {
        tracing::warn!(
            opsapi_user = %me.user.uuid,
            namespace = %config.namespace,
            "denied: not an active member of the OpsAPI workspace"
        );
        return Err(AppError::Unauthorized);
    }
    let name = [me.user.first_name, me.user.last_name]
        .into_iter()
        .flatten()
        .filter(|s| !s.trim().is_empty())
        .collect::<Vec<_>>()
        .join(" ");
    Ok(OpsApiPerson {
        uuid: me.user.uuid,
        email: me.user.email.trim().to_ascii_lowercase(),
        display_name: (!name.is_empty()).then_some(name),
    })
}

/// What the directory says about one person, asked with our own key.
#[derive(Debug, PartialEq, Eq)]
pub enum DirectoryAnswer {
    Active { email: Option<String> },
    Inactive,
    Unknown,
}

/// Step 2, and the check on every connect: ask SCIM about `uuid`.
pub async fn directory_lookup(
    state: &AppState,
    config: &OpsApiConfig,
    uuid: &str,
) -> AppResult<DirectoryAnswer> {
    // A uuid is all that is interpolated, and it is checked as one, so a value
    // from the database or from OpsAPI cannot reshape the path.
    let uuid = Uuid::parse_str(uuid)
        .map_err(|_| AppError::Unavailable("OpsAPI user id is not a uuid".into()))?;
    let response = state
        .http
        .get(endpoint(config, &format!("/scim/v2/Users/{uuid}")))
        .bearer_auth(&config.api_key)
        .timeout(TIMEOUT)
        .send()
        .await
        .map_err(unreachable)?;
    let status = response.status();
    if status == reqwest::StatusCode::NOT_FOUND {
        return Ok(DirectoryAnswer::Unknown);
    }
    if !status.is_success() {
        // 401/403 here mean *our* key is wrong or lacks the role — a
        // deployment fault, not the person's — so it is reported as
        // unavailable, and never as an allow.
        return Err(AppError::Unavailable(format!(
            "OpsAPI SCIM answered {status}; check identity.opsapi.api_key"
        )));
    }
    let user: ScimUser = response.json().await.map_err(unreachable)?;
    Ok(match user.active {
        Some(true) => DirectoryAnswer::Active { email: user.email },
        _ => DirectoryAnswer::Inactive,
    })
}

/// A uuid fit to put in a path: parsed as one, so nothing from the database or
/// from OpsAPI can reshape the URL. OpsAPI compares the path against the
/// session's uuid as a string, so the caller's spelling is kept when it is
/// already the hyphenated form.
fn path_uuid(raw: &str) -> AppResult<String> {
    let parsed = Uuid::parse_str(raw)
        .map_err(|_| AppError::Unavailable("OpsAPI user id is not a uuid".into()))?;
    let canonical = parsed.hyphenated().to_string();
    Ok(if raw.eq_ignore_ascii_case(&canonical) {
        raw.to_string()
    } else {
        canonical
    })
}

/// Who is asking OpsAPI about someone's roles.
enum Asker<'a> {
    /// The person, with their own session token — at sign-in. OpsAPI lets
    /// anyone read their own memberships.
    Person(&'a str),
    /// This deployment, with `api_key` — on connect. OpsAPI allows this only
    /// to a platform administrator, and only for a key scoped to `user`.
    Deployment,
}

/// The roles a person holds in the configured workspace, from
/// `GET /api/v2/user/{uuid}/namespace-memberships`. `None` means no active
/// membership of an active workspace there at all.
///
/// Not `/auth/me`: it lists workspaces without the roles held in them. Not
/// `/api/v2/user/namespaces` either: for a platform administrator it reports
/// `owner` of every workspace, which is not a membership anyone granted.
async fn workspace_roles(
    state: &AppState,
    config: &OpsApiConfig,
    uuid: &str,
    asker: Asker<'_>,
) -> AppResult<Option<Vec<String>>> {
    let uuid = path_uuid(uuid)?;
    let credential = match asker {
        Asker::Person(token) => token,
        Asker::Deployment => config.api_key.as_str(),
    };
    let response = state
        .http
        .get(endpoint(
            config,
            &format!("/api/v2/user/{uuid}/namespace-memberships"),
        ))
        .bearer_auth(credential)
        .timeout(TIMEOUT)
        .send()
        .await
        .map_err(unreachable)?;
    let status = response.status();
    if status == reqwest::StatusCode::NOT_FOUND {
        return Ok(None);
    }
    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
        return Err(match asker {
            // The same token /auth/me accepted a moment ago. Whatever changed,
            // it is not a yes.
            Asker::Person(_) => {
                tracing::warn!(opsapi_user = %uuid, "denied: OpsAPI refused the person's own membership lookup");
                AppError::Unauthorized
            }
            // Our key: a deployment fault, reported as unavailable, never an allow.
            Asker::Deployment => AppError::Unavailable(format!(
                "OpsAPI namespace-memberships answered {status}; identity.opsapi.api_key \
                 must carry the `user` scope and belong to a platform administrator"
            )),
        });
    }
    if !status.is_success() {
        return Err(AppError::Unavailable(format!(
            "OpsAPI namespace-memberships answered {status}"
        )));
    }
    let body: Value = response.json().await.map_err(unreachable)?;
    Ok(roles_in_workspace(&body, &config.namespace))
}

/// Pick the configured workspace's membership out of a namespace-memberships
/// answer and list the roles held there. Read defensively: the body is taken
/// at the top level or under `data`, and `roles` may be an array, null, or the
/// array still encoded as a JSON string (Postgres `json_agg` through Lapis).
fn roles_in_workspace(body: &Value, namespace: &str) -> Option<Vec<String>> {
    let body = match body.get("data") {
        Some(data) if data.get("memberships").is_some() => data,
        _ => body,
    };
    let memberships = body.get("memberships")?.as_array()?;
    let membership = memberships.iter().find(|m| {
        m.get("namespace_slug")
            .and_then(Value::as_str)
            .is_some_and(|slug| slug.eq_ignore_ascii_case(namespace))
            && m.get("status").and_then(Value::as_str) == Some("active")
            && m.get("namespace_status")
                .and_then(Value::as_str)
                .is_none_or(|s| s == "active")
    })?;

    let decoded;
    let roles = match membership.get("roles") {
        Some(Value::String(encoded)) => {
            decoded = serde_json::from_str::<Value>(encoded).unwrap_or(Value::Null);
            &decoded
        }
        Some(roles) => roles,
        None => &Value::Null,
    };
    let mut held: Vec<String> = roles
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|r| r.get("role_name").and_then(Value::as_str))
        .map(str::to_string)
        .collect();
    // An owner may hold no role rows at all; owning the workspace is the role.
    let owner = match membership.get("is_owner") {
        Some(Value::Bool(b)) => *b,
        Some(Value::String(s)) => matches!(s.as_str(), "t" | "true"),
        _ => false,
    };
    if owner {
        held.push("owner".into());
    }
    Some(held)
}

/// Whether a person holding `held` in the workspace may in. No role gate
/// configured means membership was enough.
fn holds_allowed_role(config: &OpsApiConfig, held: &Option<Vec<String>>) -> bool {
    config.allowed_roles.is_empty() || held.iter().flatten().any(|role| config.role_allowed(role))
}

/// Find or create the VPN10x user for a verified OpsAPI person.
async fn resolve_user(
    state: &AppState,
    config: &OpsApiConfig,
    person: &OpsApiPerson,
) -> AppResult<Uuid> {
    let issuer = issuer(config);
    let mut tx = state.db.begin().await?;

    let bound: Option<Uuid> = sqlx::query_scalar(
        "SELECT user_id FROM oidc_identities WHERE issuer = $1 AND subject = $2",
    )
    .bind(&issuer)
    .bind(&person.uuid)
    .fetch_optional(&mut *tx)
    .await?;

    let user_id = match bound {
        Some(user_id) => {
            sqlx::query(
                "UPDATE oidc_identities SET email = $3, updated_at = NOW() \
                 WHERE issuer = $1 AND subject = $2",
            )
            .bind(&issuer)
            .bind(&person.uuid)
            .bind(&person.email)
            .execute(&mut *tx)
            .await?;
            user_id
        }
        None => {
            // A user OpsAPI provisioned under this uuid.
            let provisioned: Option<Uuid> =
                sqlx::query_scalar("SELECT id FROM users WHERE external_id = $1")
                    .bind(&person.uuid)
                    .fetch_optional(&mut *tx)
                    .await?;
            let user_id = match provisioned {
                Some(id) => id,
                None => {
                    let taken: Option<Uuid> =
                        sqlx::query_scalar("SELECT id FROM users WHERE lower(email) = $1")
                            .bind(&person.email)
                            .fetch_optional(&mut *tx)
                            .await?;
                    if taken.is_some() {
                        tracing::warn!(
                            opsapi_user = %person.uuid,
                            "denied: an existing user has this email but was not provisioned \
                             by OpsAPI under this id; refusing to link on email alone"
                        );
                        return Err(AppError::Unauthorized);
                    }
                    if state.config.identity.admission.provisioning == Provisioning::Directory {
                        tracing::warn!(
                            opsapi_user = %person.uuid,
                            "denied: OpsAPI sign-in by someone not provisioned into VPN10x"
                        );
                        return Err(AppError::Unauthorized);
                    }
                    sqlx::query_scalar(
                        "INSERT INTO users (email, display_name, external_id, active) \
                         VALUES ($1, $2, $3, TRUE) RETURNING id",
                    )
                    .bind(&person.email)
                    .bind(person.display_name.as_deref().unwrap_or(&person.email))
                    .bind(&person.uuid)
                    .fetch_one(&mut *tx)
                    .await?
                }
            };
            sqlx::query(
                "INSERT INTO oidc_identities (issuer, subject, user_id, email) \
                 VALUES ($1, $2, $3, $4)",
            )
            .bind(&issuer)
            .bind(&person.uuid)
            .bind(user_id)
            .bind(&person.email)
            .execute(&mut *tx)
            .await?;
            user_id
        }
    };

    let active: bool = sqlx::query_scalar("SELECT active FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(&mut *tx)
        .await?;
    if !active {
        tracing::warn!(%user_id, "denied: OpsAPI sign-in by a user VPN10x has disabled");
        return Err(AppError::Unauthorized);
    }
    tx.commit().await?;
    Ok(user_id)
}

/// The sign-in methods a client may offer. Public: the app reads it before
/// anyone has signed in.
#[derive(Debug, Serialize)]
pub struct SignInMethods {
    /// Browser sign-in through the configured OIDC provider.
    pub oidc: bool,
    pub opsapi: Option<OpsApiMethod>,
}

#[derive(Debug, Serialize)]
pub struct OpsApiMethod {
    /// Where the app sends the email and password. Not the control plane.
    pub url: String,
    pub namespace: String,
    /// Membership alone is not enough: the person also needs one of the
    /// workspace roles this deployment admits. The role names are not listed.
    pub roles_required: bool,
}

pub async fn methods(State(state): State<AppState>) -> Json<SignInMethods> {
    Json(SignInMethods {
        oidc: true,
        opsapi: state.config.identity.opsapi.as_ref().map(|o| OpsApiMethod {
            url: o.url.trim_end_matches('/').to_string(),
            namespace: o.namespace.clone(),
            roles_required: !o.allowed_roles.is_empty(),
        }),
    })
}

#[derive(Deserialize)]
pub struct ExchangeRequest {
    /// The OpsAPI session token the app got from OpsAPI's `/auth/login`.
    pub token: String,
}

/// Trade an OpsAPI session for a VPN10x access token.
pub async fn exchange(
    State(state): State<AppState>,
    Json(body): Json<ExchangeRequest>,
) -> AppResult<Json<TokenResponse>> {
    let Some(config) = state.config.identity.opsapi.clone() else {
        return Err(AppError::NotFound);
    };
    let token = body.token.trim();
    let person = whose_session(&state, &config, token).await?;
    if !config.allowed_roles.is_empty() {
        let held = workspace_roles(&state, &config, &person.uuid, Asker::Person(token)).await?;
        if !holds_allowed_role(&config, &held) {
            tracing::warn!(
                opsapi_user = %person.uuid,
                namespace = %config.namespace,
                ?held,
                "denied: no allowed OpsAPI role in the workspace"
            );
            return Err(AppError::Unauthorized);
        }
    }
    drop(body);

    match directory_lookup(&state, &config, &person.uuid).await? {
        DirectoryAnswer::Active { email } => {
            // The two answers must be about the same person.
            if email.is_some_and(|e| !e.trim().eq_ignore_ascii_case(&person.email)) {
                tracing::warn!(opsapi_user = %person.uuid, "denied: SCIM and /auth/me disagree on email");
                return Err(AppError::Unauthorized);
            }
        }
        answer => {
            tracing::warn!(opsapi_user = %person.uuid, ?answer, "denied: directory does not confirm an active user");
            return Err(AppError::Unauthorized);
        }
    }

    let user_id = resolve_user(&state, &config, &person).await?;
    let (access_token, expires_in) = mint_access_token(&state, user_id).await?;
    tracing::info!(%user_id, opsapi_user = %person.uuid, "signed in with OpsAPI");
    Ok(Json(TokenResponse {
        access_token,
        token_type: "Bearer",
        expires_in,
        user_id,
        email: person.email,
    }))
}

/// Why connect refused someone, for the audit record.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConnectRefusal {
    /// SCIM says inactive, or does not know them.
    NotActive,
    /// Active, but holding none of `allowed_roles` in the workspace.
    RoleNotAllowed,
}

impl ConnectRefusal {
    pub fn audit_reason(self) -> &'static str {
        match self {
            ConnectRefusal::NotActive => "opsapi: user not active in directory",
            ConnectRefusal::RoleNotAllowed => "opsapi: role not allowed in workspace",
        }
    }
}

/// The check on connect: if OpsAPI provisioned this user, it must still say
/// they are active — and, with `allowed_roles`, that they still hold one of
/// them. Users OpsAPI did not provision (no `external_id`) are not its to
/// judge, and pass through to the usual policy evaluation.
///
/// `Ok(Err(_))` is a refusal (a 403 to audit); `Err(_)` is OpsAPI or the
/// database failing to answer, never an allow.
pub async fn verify_on_connect(
    state: &AppState,
    user_id: Uuid,
) -> AppResult<Result<(), ConnectRefusal>> {
    let Some(config) = state.config.identity.opsapi.as_ref() else {
        return Ok(Ok(()));
    };
    if !config.verify_on_connect {
        return Ok(Ok(()));
    }
    let external: Option<String> =
        sqlx::query_scalar("SELECT external_id FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(&state.db)
            .await?
            .flatten();
    let Some(uuid) = external.filter(|e| Uuid::parse_str(e).is_ok()) else {
        return Ok(Ok(()));
    };
    match directory_lookup(state, config, &uuid).await? {
        DirectoryAnswer::Active { .. } => {}
        answer => {
            tracing::warn!(%user_id, ?answer, "denied: OpsAPI no longer lists this user as active");
            return Ok(Err(ConnectRefusal::NotActive));
        }
    }
    if config.allowed_roles.is_empty() {
        return Ok(Ok(()));
    }
    // Asked again each time, so a role removed in OpsAPI stops the next
    // connection rather than waiting for the VPN10x token to expire.
    let held = workspace_roles(state, config, &uuid, Asker::Deployment).await?;
    if !holds_allowed_role(config, &held) {
        tracing::warn!(%user_id, ?held, "denied: no allowed OpsAPI role in the workspace");
        return Ok(Err(ConnectRefusal::RoleNotAllowed));
    }
    Ok(Ok(()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn membership(slug: &str, roles: Value) -> Value {
        json!({
            "membership_uuid": "m", "status": "active", "is_owner": false,
            "namespace_uuid": "n", "namespace_name": slug, "namespace_slug": slug,
            "namespace_status": "active", "roles": roles,
        })
    }

    fn roles(names: &[&str]) -> Value {
        Value::Array(
            names
                .iter()
                .map(|n| json!({ "id": 1, "role_name": n, "display_name": n }))
                .collect(),
        )
    }

    #[test]
    fn roles_are_read_from_the_configured_workspace_only() {
        let body = json!({ "memberships": [
            membership("someone-elses-shop", roles(&["admin"])),
            membership("Workstation", roles(&["vpn-user", "viewer"])),
        ], "total": 2 });
        assert_eq!(
            roles_in_workspace(&body, "workstation"),
            Some(vec!["vpn-user".to_string(), "viewer".to_string()])
        );
        assert_eq!(roles_in_workspace(&body, "elsewhere"), None);
    }

    #[test]
    fn the_answer_is_read_at_the_top_level_or_under_data() {
        let inner = json!({ "memberships": [membership("workstation", roles(&["admin"]))] });
        let wrapped = json!({ "data": inner.clone() });
        assert_eq!(
            roles_in_workspace(&inner, "workstation"),
            roles_in_workspace(&wrapped, "workstation")
        );
        assert_eq!(
            roles_in_workspace(&wrapped, "workstation"),
            Some(vec!["admin".into()])
        );
    }

    #[test]
    fn roles_may_be_null_or_json_encoded_in_a_string() {
        let null = json!({ "memberships": [membership("workstation", Value::Null)] });
        assert_eq!(roles_in_workspace(&null, "workstation"), Some(vec![]));
        let encoded = json!({ "memberships": [membership(
            "workstation",
            Value::String(roles(&["admin"]).to_string()),
        )] });
        assert_eq!(
            roles_in_workspace(&encoded, "workstation"),
            Some(vec!["admin".into()])
        );
        let garbage = json!({ "memberships": [membership("workstation", json!("not json"))] });
        assert_eq!(roles_in_workspace(&garbage, "workstation"), Some(vec![]));
    }

    #[test]
    fn an_owner_holds_owner_even_without_role_rows() {
        let mut m = membership("workstation", Value::Null);
        m["is_owner"] = json!(true);
        let body = json!({ "memberships": [m] });
        assert_eq!(
            roles_in_workspace(&body, "workstation"),
            Some(vec!["owner".into()])
        );
    }

    /// A suspended membership, or a suspended workspace, holds no roles.
    #[test]
    fn inactive_memberships_and_workspaces_do_not_count() {
        let mut suspended = membership("workstation", roles(&["admin"]));
        suspended["status"] = json!("suspended");
        assert_eq!(
            roles_in_workspace(&json!({ "memberships": [suspended] }), "workstation"),
            None
        );
        let mut closed = membership("workstation", roles(&["admin"]));
        closed["namespace_status"] = json!("archived");
        assert_eq!(
            roles_in_workspace(&json!({ "memberships": [closed] }), "workstation"),
            None
        );
        let mut no_status = membership("workstation", roles(&["admin"]));
        no_status
            .as_object_mut()
            .unwrap()
            .remove("namespace_status");
        assert_eq!(
            roles_in_workspace(&json!({ "memberships": [no_status] }), "workstation"),
            Some(vec!["admin".into()])
        );
        // No memberships at all, or an empty table encoded as an object.
        assert_eq!(
            roles_in_workspace(&json!({ "memberships": {} }), "workstation"),
            None
        );
        assert_eq!(roles_in_workspace(&json!({}), "workstation"), None);
    }

    #[test]
    fn the_gate_compares_role_names_case_insensitively() {
        let mut config = OpsApiConfig {
            url: "https://api.example.com".into(),
            namespace: "workstation".into(),
            api_key: "opsk_x".into(),
            verify_on_connect: true,
            allowed_roles: vec![],
        };
        assert!(holds_allowed_role(&config, &None), "no gate configured");
        config.allowed_roles = vec!["VPN-User".into(), "owner".into()];
        assert!(holds_allowed_role(&config, &Some(vec!["vpn-user".into()])));
        assert!(holds_allowed_role(&config, &Some(vec!["owner".into()])));
        assert!(!holds_allowed_role(&config, &Some(vec!["viewer".into()])));
        assert!(!holds_allowed_role(&config, &Some(vec![])));
        assert!(!holds_allowed_role(&config, &None));
    }

    #[test]
    fn only_a_uuid_is_put_in_a_path() {
        let id = "0f8fad5b-d9cb-469f-a165-70867728950e";
        assert_eq!(path_uuid(id).unwrap(), id);
        assert_eq!(
            path_uuid(&id.to_ascii_uppercase()).unwrap(),
            id.to_ascii_uppercase()
        );
        assert_eq!(path_uuid(&id.replace('-', "")).unwrap(), id);
        assert!(path_uuid("../../admin").is_err());
    }
}
