//! Signing in with an OpsAPI account, and OpsAPI being asked again on connect.
//!
//! OpsAPI is not an OIDC provider (ADR-0003): its tokens are HS256 under a
//! secret the control plane must never hold. So the control plane does not
//! verify an OpsAPI token itself. It asks OpsAPI, twice, from two directions:
//!
//!   * `GET /auth/me` with the person's token — is this a live session, for
//!     whom, and are they an active member of our namespace?
//!   * `GET /scim/v2/Users/{uuid}` with the control plane's own `opsk_` key —
//!     does the directory, asked independently of anything the client sent,
//!     agree that this person exists and is active?
//!
//! With `allowed_roles` configured it asks a third question, at sign-in and on
//! every connect: `GET /api/v2/user/{uuid}/namespace-memberships` — does the
//! person hold one of the admitted roles in our namespace? (ADR-0005)
//!
//! The stand-in OpsAPI below answers all three the way the real one does (the
//! shapes are taken from `routes/auth.lua`, `routes/users.lua` and
//! `routes/namespaces.lua`), so what is pinned down here is the control plane's
//! decision, against a real database.
//!
//! Requires a PostgreSQL instance; `#[sqlx::test]` provisions an isolated
//! database per test from `DATABASE_URL` and runs the migrations into it.

mod common;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::routing::get as route;
use axum::{Json, Router};
use common::*;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;
use vpn10x_control::config::{AdmissionConfig, OpsApiConfig, Provisioning};
use vpn10x_control::state::AppState;

const NAMESPACE: &str = "workstation";
const API_KEY: &str = "opsk_0123456789abcdef0123456789abcdef0123456789abcdef";

/// A person as OpsAPI knows them.
#[derive(Clone)]
struct Person {
    uuid: String,
    email: String,
    active: bool,
    namespaces: Vec<&'static str>,
    /// Namespace roles held in each of `namespaces`.
    roles: Vec<&'static str>,
    is_owner: bool,
}

#[derive(Default)]
struct Directory {
    /// Session token → uuid, as OpsAPI's JWTs map to a user.
    sessions: HashMap<String, String>,
    people: HashMap<String, Person>,
    /// Make the memberships lookup answer 500.
    memberships_broken: bool,
    /// Our key lacks the `user` scope: OpsAPI refuses it on `/api/v2/user/...`.
    key_lacks_user_scope: bool,
}

type Shared = Arc<Mutex<Directory>>;

fn bearer(headers: &HeaderMap) -> Option<String> {
    headers
        .get("authorization")?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")
        .map(str::to_string)
}

/// `GET /auth/me`: the session's user and their active namespaces.
async fn me(
    State(dir): State<Shared>,
    headers: HeaderMap,
) -> (StatusCode, Json<serde_json::Value>) {
    let dir = dir.lock().unwrap();
    let person = bearer(&headers)
        .and_then(|t| dir.sessions.get(&t).cloned())
        .and_then(|uuid| dir.people.get(&uuid).cloned());
    match person {
        Some(p) => (
            StatusCode::OK,
            Json(json!({
                "user": { "id": 7, "uuid": p.uuid, "email": p.email, "active": p.active,
                          "first_name": "Alice", "last_name": "Example" },
                "namespaces": p.namespaces.iter().map(|slug| json!({
                    "id": 1, "uuid": "ns-uuid", "name": slug, "slug": slug,
                    "status": "active", "member_status": "active", "is_owner": false
                })).collect::<Vec<_>>(),
            })),
        ),
        None => (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid or expired token" })),
        ),
    }
}

/// `GET /scim/v2/Users/{uuid}`: platform-admin only, which the API key is.
async fn scim_user(
    State(dir): State<Shared>,
    headers: HeaderMap,
    Path(uuid): Path<String>,
) -> (StatusCode, Json<serde_json::Value>) {
    if bearer(&headers).as_deref() != Some(API_KEY) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid API key" })),
        );
    }
    match dir.lock().unwrap().people.get(&uuid) {
        Some(p) => (
            StatusCode::OK,
            Json(json!({ "id": p.uuid, "uuid": p.uuid, "internal_id": 7,
                         "email": p.email, "username": p.email, "active": p.active,
                         "roles": [] })),
        ),
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "User not found! Please check the UUID and try again." })),
        ),
    }
}

/// `GET /api/v2/user/{uuid}/namespace-memberships`: the person themself, or a
/// platform admin (the API key) whose key is scoped to `user`.
async fn memberships(
    State(dir): State<Shared>,
    headers: HeaderMap,
    Path(uuid): Path<String>,
) -> (StatusCode, Json<serde_json::Value>) {
    let dir = dir.lock().unwrap();
    if dir.memberships_broken {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Internal server error" })),
        );
    }
    let caller = bearer(&headers);
    let is_key = caller.as_deref() == Some(API_KEY);
    if is_key && dir.key_lacks_user_scope {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "API key is not scoped for this module" })),
        );
    }
    let is_self = caller
        .and_then(|t| dir.sessions.get(&t).cloned())
        .is_some_and(|own| own == uuid);
    if !is_key && !is_self {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "You can only view your own namespace memberships" })),
        );
    }
    let Some(p) = dir.people.get(&uuid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "User not found" })),
        );
    };
    let memberships: Vec<_> = p
        .namespaces
        .iter()
        .map(|slug| {
            // json_agg over no rows is NULL, which is what an owner with no
            // role rows gets.
            let roles = if p.roles.is_empty() {
                serde_json::Value::Null
            } else {
                json!(p
                    .roles
                    .iter()
                    .enumerate()
                    .map(|(i, r)| json!({ "id": i + 1, "role_name": r, "display_name": r }))
                    .collect::<Vec<_>>())
            };
            json!({
                "membership_id": 3, "membership_uuid": Uuid::new_v4(), "status": "active",
                "is_owner": p.is_owner, "joined_at": "2026-10-01 00:00:00",
                "namespace_id": 1, "namespace_uuid": Uuid::new_v4(), "namespace_name": slug,
                "namespace_slug": slug, "namespace_status": "active", "logo_url": null,
                "roles": roles,
            })
        })
        .collect();
    let total = memberships.len();
    (
        StatusCode::OK,
        Json(json!({
            "user": { "uuid": p.uuid, "email": p.email, "first_name": "Alice", "last_name": "Example" },
            "memberships": memberships,
            "total": total,
        })),
    )
}

struct OpsApi {
    url: String,
    dir: Shared,
}

impl OpsApi {
    async fn start() -> Self {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        let dir: Shared = Arc::default();
        let app = Router::new()
            .route("/auth/me", route(me))
            .route("/scim/v2/Users/{id}", route(scim_user))
            .route(
                "/api/v2/user/{id}/namespace-memberships",
                route(memberships),
            )
            .with_state(dir.clone());
        tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
        Self { url, dir }
    }

    /// Add someone with a live session; returns (uuid, their OpsAPI token).
    fn person(&self, email: &str, namespaces: Vec<&'static str>) -> (String, String) {
        let uuid = Uuid::new_v4().to_string();
        let token = format!("opsapi-jwt-{}", Uuid::new_v4());
        let mut dir = self.dir.lock().unwrap();
        dir.people.insert(
            uuid.clone(),
            Person {
                uuid: uuid.clone(),
                email: email.into(),
                active: true,
                namespaces,
                roles: Vec::new(),
                is_owner: false,
            },
        );
        dir.sessions.insert(token.clone(), uuid.clone());
        (uuid, token)
    }

    /// Set the namespace roles someone holds, and whether they own it.
    fn grant(&self, uuid: &str, roles: Vec<&'static str>, is_owner: bool) {
        let mut dir = self.dir.lock().unwrap();
        let person = dir.people.get_mut(uuid).unwrap();
        person.roles = roles;
        person.is_owner = is_owner;
    }

    fn deactivate(&self, uuid: &str) {
        self.dir
            .lock()
            .unwrap()
            .people
            .get_mut(uuid)
            .unwrap()
            .active = false;
    }

    fn forget(&self, uuid: &str) {
        self.dir.lock().unwrap().people.remove(uuid);
    }
}

fn opsapi_config(url: &str) -> OpsApiConfig {
    OpsApiConfig {
        url: url.into(),
        namespace: NAMESPACE.into(),
        api_key: API_KEY.into(),
        verify_on_connect: true,
        allowed_roles: Vec::new(),
    }
}

/// The same, admitting only people holding one of `roles` in the namespace.
fn opsapi_config_with_roles(url: &str, roles: &[&str]) -> OpsApiConfig {
    OpsApiConfig {
        allowed_roles: roles.iter().map(|r| r.to_string()).collect(),
        ..opsapi_config(url)
    }
}

async fn control_plane(
    pool: &PgPool,
    opsapi: Option<OpsApiConfig>,
    provisioning: Provisioning,
) -> Router {
    let mut config = test_config();
    config.identity.opsapi = opsapi;
    config.identity.admission = AdmissionConfig {
        provisioning,
        ..Default::default()
    };
    let state = AppState::with_pool(config, pool.clone());
    state.bootstrap().await.expect("bootstrap");
    vpn10x_control::routes::router(state)
}

/// OpsAPI provisions the person into VPN10x, naming them by its own uuid.
async fn provision(app: &Router, email: &str, uuid: &str) {
    let (status, body) = post(
        "/api/v1/ops/users",
        json!({ "email": email, "external_id": uuid }),
    )
    .with_token(OPS_TOKEN)
    .send(app)
    .await;
    assert!(status.is_success(), "{status} {body}");
}

async fn exchange(app: &Router, token: &str) -> (StatusCode, serde_json::Value) {
    post("/auth/opsapi/exchange", json!({ "token": token }))
        .send(app)
        .await
}

async fn user_count(pool: &PgPool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await
        .unwrap()
}

#[sqlx::test(migrations = "../../migrations")]
async fn the_app_is_told_which_sign_in_methods_this_control_plane_offers(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (status, body) = get("/auth/methods").send(&app).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["oidc"], true);
    assert_eq!(body["opsapi"]["url"], ops.url.as_str());
    assert_eq!(body["opsapi"]["roles_required"], false);
    // The key is the control plane's credential; it is never handed out.
    assert!(!body.to_string().contains("opsk_"), "{body}");

    let app = control_plane(&pool, None, Provisioning::Directory).await;
    let (_, body) = get("/auth/methods").send(&app).await;
    assert!(body["opsapi"].is_null(), "{body}");
}

#[sqlx::test(migrations = "../../migrations")]
async fn a_provisioned_member_signs_in_and_gets_a_token_that_works(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    provision(&app, "alice@example.com", &uuid).await;

    let (status, body) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["email"], "alice@example.com");
    let access = body["access_token"].as_str().expect("an access token");

    let (status, _) = get("/api/v1/sessions").with_token(access).send(&app).await;
    assert_eq!(
        status,
        StatusCode::OK,
        "the token is a working VPN10x credential"
    );

    // The binding is on OpsAPI's uuid, so a second sign-in finds the same user
    // without consulting the email at all.
    let (status, again) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(again["user_id"], body["user_id"]);
}

#[sqlx::test(migrations = "../../migrations")]
async fn a_token_opsapi_does_not_recognise_is_refused(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(&pool, Some(opsapi_config(&ops.url)), Provisioning::Jit).await;
    let (status, _) = exchange(&app, "forged-or-expired").await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(user_count(&pool).await, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn someone_outside_the_namespace_is_refused(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(&pool, Some(opsapi_config(&ops.url)), Provisioning::Jit).await;
    // A real OpsAPI account, in some other workspace — exactly what open
    // sign-up at OpsAPI produces.
    let (_, token) = ops.person("stranger@example.com", vec!["someone-elses-shop"]);
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(user_count(&pool).await, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn the_directory_saying_inactive_wins_over_a_live_session(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    provision(&app, "alice@example.com", &uuid).await;
    ops.deactivate(&uuid);
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn someone_scim_cannot_find_is_refused(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(&pool, Some(opsapi_config(&ops.url)), Provisioning::Jit).await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    // The session still answers /auth/me, but the directory no longer has them.
    {
        let mut dir = ops.dir.lock().unwrap();
        let person = dir.people.remove(&uuid).unwrap();
        dir.people.insert("someone-else".into(), person);
    }
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

/// The account-takeover case. OpsAPI does not require a verified email to
/// register, so "an OpsAPI account with alice's address" is not alice. Only a
/// user OpsAPI itself provisioned under this uuid may be signed into.
#[sqlx::test(migrations = "../../migrations")]
async fn an_email_match_alone_never_signs_into_an_existing_user(pool: PgPool) {
    let ops = OpsApi::start().await;
    for provisioning in [Provisioning::Jit, Provisioning::Directory] {
        let app = control_plane(&pool, Some(opsapi_config(&ops.url)), provisioning).await;
        let email = format!("victim-{provisioning:?}@example.com");
        // Alice exists in VPN10x already — from Google, say — with no OpsAPI link.
        let (status, _) = post("/api/v1/ops/users", json!({ "email": email }))
            .with_token(OPS_TOKEN)
            .send(&app)
            .await;
        assert!(status.is_success());
        let (_, token) = ops.person(&email, vec![NAMESPACE]);
        let (status, _) = exchange(&app, &token).await;
        assert_eq!(status, StatusCode::UNAUTHORIZED, "{provisioning:?}");
    }
}

#[sqlx::test(migrations = "../../migrations")]
async fn directory_admission_refuses_someone_vpn10x_was_never_given(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (_, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(user_count(&pool).await, 0);
}

#[sqlx::test(migrations = "../../migrations")]
async fn jit_admission_creates_the_user_bound_to_the_opsapi_uuid(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(&pool, Some(opsapi_config(&ops.url)), Provisioning::Jit).await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    let (status, body) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let external: Option<String> =
        sqlx::query_scalar("SELECT external_id FROM users WHERE email = 'alice@example.com'")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(external.as_deref(), Some(uuid.as_str()));
}

#[sqlx::test(migrations = "../../migrations")]
async fn a_user_vpn10x_has_disabled_stays_out(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    provision(&app, "alice@example.com", &uuid).await;
    sqlx::query("UPDATE users SET active = FALSE WHERE external_id = $1")
        .bind(&uuid)
        .execute(&pool)
        .await
        .unwrap();
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../../migrations")]
async fn without_opsapi_configured_there_is_no_such_sign_in(pool: PgPool) {
    let app = control_plane(&pool, None, Provisioning::Jit).await;
    let (status, _) = exchange(&app, "anything").await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

/// Connect asks again. A session is the point at which access is granted, so
/// someone deprovisioned in OpsAPI after signing in is stopped here rather than
/// when their VPN10x token happens to expire.
#[sqlx::test(migrations = "../../migrations")]
async fn connect_rechecks_the_directory_before_granting_a_session(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    provision(&app, "alice@example.com", &uuid).await;
    let (_, body) = exchange(&app, &token).await;
    let access = body["access_token"].as_str().unwrap().to_string();

    let request = json!({
        "device_id": Uuid::new_v4(),
        "network_id": Uuid::new_v4(),
        "posture": [],
    });
    let session = || post("/api/v1/sessions", request.clone()).with_token(&access);

    // Active in OpsAPI: the check passes and the request goes on to the device
    // lookup, which knows no such device.
    let (status, body) = session().send(&app).await;
    assert_eq!(status, StatusCode::NOT_FOUND, "{body}");

    ops.deactivate(&uuid);
    let (status, _) = session().send(&app).await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    ops.forget(&uuid);
    let (status, _) = session().send(&app).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}

/// If OpsAPI cannot be asked, the answer is not "yes".
#[sqlx::test(migrations = "../../migrations")]
async fn connect_fails_closed_when_opsapi_cannot_be_reached(pool: PgPool) {
    let ops = OpsApi::start().await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    let live = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    provision(&live, "alice@example.com", &uuid).await;
    let (_, body) = exchange(&live, &token).await;
    let access = body["access_token"].as_str().unwrap().to_string();

    let dead = control_plane(
        &pool,
        Some(opsapi_config("http://127.0.0.1:1")),
        Provisioning::Directory,
    )
    .await;
    let (status, _) = post(
        "/api/v1/sessions",
        json!({ "device_id": Uuid::new_v4(), "network_id": Uuid::new_v4(), "posture": [] }),
    )
    .with_token(&access)
    .send(&dead)
    .await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
}

/// People OpsAPI did not provision (no external id) are not OpsAPI's to judge.
#[sqlx::test(migrations = "../../migrations")]
async fn connect_does_not_consult_opsapi_about_users_it_does_not_own(pool: PgPool) {
    let app = control_plane(
        &pool,
        Some(opsapi_config("http://127.0.0.1:1")),
        Provisioning::Jit,
    )
    .await;
    let (_, access) = user_with_token(&pool, "google-only@example.com", "member").await;
    let (status, body) = post(
        "/api/v1/sessions",
        json!({ "device_id": Uuid::new_v4(), "network_id": Uuid::new_v4(), "posture": [] }),
    )
    .with_token(&access)
    .send(&app)
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "{body}");
}

/// Someone who had a VPN account before OpsAPI was connected — a bootstrap
/// administrator, say — is linked by OpsAPI's own provisioning call, which is
/// the directory asserting who they are. An email match at sign-in never is.
#[sqlx::test(migrations = "../../migrations")]
async fn provisioning_links_an_existing_account_to_its_opsapi_id(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (status, _) = post("/api/v1/ops/users", json!({ "email": "admin@example.com" }))
        .with_token(OPS_TOKEN)
        .send(&app)
        .await;
    assert!(status.is_success());
    let (uuid, token) = ops.person("admin@example.com", vec![NAMESPACE]);
    assert_eq!(exchange(&app, &token).await.0, StatusCode::UNAUTHORIZED);

    provision(&app, "admin@example.com", &uuid).await;
    let (status, body) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(user_count(&pool).await, 1, "linked, not duplicated");

    // Re-provisioning with the same id is a no-op; a different id is a
    // conflict, never a silent re-link.
    provision(&app, "admin@example.com", &uuid).await;
    let (status, _) = post(
        "/api/v1/ops/users",
        json!({ "email": "admin@example.com", "external_id": Uuid::new_v4().to_string() }),
    )
    .with_token(OPS_TOKEN)
    .send(&app)
    .await;
    assert_eq!(status, StatusCode::CONFLICT);
}

// ---- The role gate (ADR-0005) -------------------------------------------

const ROLES: &[&str] = &["owner", "admin", "vpn-user"];

fn connect_request() -> serde_json::Value {
    json!({ "device_id": Uuid::new_v4(), "network_id": Uuid::new_v4(), "posture": [] })
}

#[sqlx::test(migrations = "../../migrations")]
async fn the_app_is_told_a_role_is_required_but_not_which(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config_with_roles(&ops.url, ROLES)),
        Provisioning::Directory,
    )
    .await;
    let (_, body) = get("/auth/methods").send(&app).await;
    assert_eq!(body["opsapi"]["roles_required"], true, "{body}");
    assert_eq!(body["opsapi"]["namespace"], NAMESPACE);
    assert!(!body.to_string().contains("vpn-user"), "{body}");
}

#[sqlx::test(migrations = "../../migrations")]
async fn a_member_holding_an_allowed_role_signs_in(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config_with_roles(&ops.url, ROLES)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    // Role names are compared without regard to case.
    ops.grant(&uuid, vec!["viewer", "VPN-User"], false);
    provision(&app, "alice@example.com", &uuid).await;
    let (status, body) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK, "{body}");
}

/// Membership is what admits without a role gate. With one, a member holding
/// no allowed role stays out.
#[sqlx::test(migrations = "../../migrations")]
async fn a_member_without_an_allowed_role_is_refused(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config_with_roles(&ops.url, ROLES)),
        Provisioning::Jit,
    )
    .await;
    let (uuid, token) = ops.person("bob@example.com", vec![NAMESPACE]);
    ops.grant(&uuid, vec!["viewer"], false);
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let (_, token) = ops.person("carol@example.com", vec![NAMESPACE]);
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED, "no roles at all");
    assert_eq!(user_count(&pool).await, 0);
}

/// A workspace owner may hold no role rows; owning it counts as `owner`.
#[sqlx::test(migrations = "../../migrations")]
async fn the_workspace_owner_counts_as_holding_owner(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config_with_roles(&ops.url, &["owner"])),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("owner@example.com", vec![NAMESPACE]);
    ops.grant(&uuid, vec![], true);
    provision(&app, "owner@example.com", &uuid).await;
    let (status, body) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK, "{body}");
}

/// Roles are asked again on connect, with our key. Taking the role away in
/// OpsAPI stops the next connection, and the refusal is audited as a role
/// refusal, not as a deprovisioning.
#[sqlx::test(migrations = "../../migrations")]
async fn connect_after_the_role_is_removed_is_refused_and_audited(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config_with_roles(&ops.url, ROLES)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    ops.grant(&uuid, vec!["vpn-user"], false);
    provision(&app, "alice@example.com", &uuid).await;
    let (_, body) = exchange(&app, &token).await;
    let access = body["access_token"].as_str().unwrap().to_string();
    let user_id: Uuid = body["user_id"].as_str().unwrap().parse().unwrap();

    let request = connect_request();
    let session = || post("/api/v1/sessions", request.clone()).with_token(&access);

    // Still holding the role: on to the device lookup, which knows no such device.
    let (status, body) = session().send(&app).await;
    assert_eq!(status, StatusCode::NOT_FOUND, "{body}");

    ops.grant(&uuid, vec!["viewer"], false);
    let (status, _) = session().send(&app).await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let reasons: Vec<serde_json::Value> = sqlx::query_scalar(
        "SELECT details->'reason' FROM audit_events \
         WHERE action = 'session.create' AND decision = 'deny' AND user_id = $1",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(
        reasons,
        vec![json!("opsapi: role not allowed in workspace")],
        "one audited role refusal"
    );

    // Deprovisioned outright is still told apart.
    ops.deactivate(&uuid);
    let (status, _) = session().send(&app).await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let latest: serde_json::Value = sqlx::query_scalar(
        "SELECT details->'reason' FROM audit_events \
         WHERE action = 'session.create' AND decision = 'deny' AND user_id = $1 \
         ORDER BY created_at DESC LIMIT 1",
    )
    .bind(user_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(latest, json!("opsapi: user not active in directory"));
}

/// If OpsAPI cannot say which roles someone holds, the answer is not "yes" —
/// at sign-in or on connect.
#[sqlx::test(migrations = "../../migrations")]
async fn a_broken_memberships_lookup_fails_closed(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config_with_roles(&ops.url, ROLES)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    ops.grant(&uuid, vec!["admin"], false);
    provision(&app, "alice@example.com", &uuid).await;
    let (_, body) = exchange(&app, &token).await;
    let access = body["access_token"].as_str().unwrap().to_string();

    ops.dir.lock().unwrap().memberships_broken = true;
    let (status, _) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    let (status, _) = post("/api/v1/sessions", connect_request())
        .with_token(&access)
        .send(&app)
        .await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
}

/// Our key reaching `/api/v2/user/...` needs the `user` scope. Without it the
/// fault is the deployment's: 503 with a pointer at the key, never a 403 for
/// the person and never an allow.
#[sqlx::test(migrations = "../../migrations")]
async fn a_key_without_the_user_scope_is_a_deployment_fault(pool: PgPool) {
    let ops = OpsApi::start().await;
    let app = control_plane(
        &pool,
        Some(opsapi_config_with_roles(&ops.url, ROLES)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    ops.grant(&uuid, vec!["admin"], false);
    provision(&app, "alice@example.com", &uuid).await;
    // Sign-in asks with the person's own token, so it is unaffected.
    ops.dir.lock().unwrap().key_lacks_user_scope = true;
    let (status, body) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let access = body["access_token"].as_str().unwrap().to_string();

    let (status, body) = post("/api/v1/sessions", connect_request())
        .with_token(&access)
        .send(&app)
        .await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
    assert!(
        body["message"]
            .as_str()
            .unwrap_or("")
            .contains("`user` scope"),
        "{body}"
    );
}

/// Without allowed_roles the memberships endpoint is never asked: membership
/// alone admits, exactly as before.
#[sqlx::test(migrations = "../../migrations")]
async fn without_allowed_roles_membership_alone_admits(pool: PgPool) {
    let ops = OpsApi::start().await;
    ops.dir.lock().unwrap().memberships_broken = true;
    let app = control_plane(
        &pool,
        Some(opsapi_config(&ops.url)),
        Provisioning::Directory,
    )
    .await;
    let (uuid, token) = ops.person("alice@example.com", vec![NAMESPACE]);
    provision(&app, "alice@example.com", &uuid).await;
    let (status, body) = exchange(&app, &token).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let access = body["access_token"].as_str().unwrap().to_string();
    let (status, body) = post("/api/v1/sessions", connect_request())
        .with_token(&access)
        .send(&app)
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "{body}");
}
