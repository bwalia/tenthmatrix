import Foundation

/// What a control plane lets people sign in with: `GET /auth/methods`.
public struct SignInMethods: Codable, Sendable, Equatable {
    public let oidc: Bool
    public let opsapi: OpsAPIMethod?

    public init(oidc: Bool, opsapi: OpsAPIMethod?) {
        self.oidc = oidc
        self.opsapi = opsapi
    }

    /// A control plane from before OpsAPI sign-in has no `/auth/methods`,
    /// which means browser sign-in only.
    public static let browserOnly = SignInMethods(oidc: true, opsapi: nil)
}

public struct OpsAPIMethod: Codable, Sendable, Equatable {
    /// Where the email and password go. Never the control plane.
    public let url: String
    /// The OpsAPI workspace people must be active members of.
    public let namespace: String
    /// Whether membership alone is not enough: the control plane also wants
    /// one of its configured workspace roles. Absent from older control planes.
    public let rolesRequired: Bool?
}

/// Signing in with an OpsAPI account (ADR-0004).
///
/// The password goes to OpsAPI and nowhere else. The control plane only ever
/// sees the OpsAPI session token that comes back, which it hands to OpsAPI to
/// ask whose it is — and which workspace roles they hold — before trading it
/// for a VPN10x token of its own.
///
/// ```text
/// app ──email, password──▶ OpsAPI /auth/login ──▶ token, or "send the code"
/// app ──challenge, code──▶ OpsAPI /auth/2fa/verify ──▶ token
/// app ──token──▶ control plane /auth/opsapi/exchange ──▶ VPN10x access token
/// ```
///
/// OpsAPI reads `/auth/login` as a form; a JSON body is silently ignored and
/// the request fails as if the fields were missing (ADR-0003), so both calls
/// send forms. This mirrors `vpn10x-agent/src/opsapi.rs` call for call.
public struct OpsAPILogin: Sendable {
    public enum Step: Sendable, Equatable {
        /// Signed in to OpsAPI. The token goes straight on to the control plane.
        case token(String)
        /// OpsAPI emailed a sign-in code. `challenge` proves the password was
        /// right and goes back with the code.
        case codeRequired(challenge: String, email: String)
    }

    public enum LoginError: Error, LocalizedError, Equatable {
        case insecureURL(String)
        case invalidCredentials
        case throttled(String)
        case deactivated
        case codeRejected
        case refused(String)
        case unreadable

        public var errorDescription: String? {
            switch self {
            case .insecureURL(let url):
                return "The control plane advertised an OpsAPI address that is not HTTPS: \(url)"
            case .invalidCredentials:
                return "Email or password is incorrect."
            case .throttled(let message):
                return message
            case .deactivated:
                return "This OpsAPI account has been deactivated."
            case .codeRejected:
                return "That code was not accepted. Check it, or start again for a new one."
            case .refused(let message):
                return message
            case .unreadable:
                return "OpsAPI's answer was not readable."
            }
        }
    }

    public let baseURL: URL
    private let session: URLSession

    /// A password is about to go to `url`: the same rule the CLI applies,
    /// HTTPS, or plain HTTP only to this machine.
    public init(url: String, session: URLSession = .shared) throws {
        let trimmed = url.trimmingCharacters(in: .whitespaces)
        guard let parsed = URL(string: trimmed), OpsAPILogin.isAcceptable(parsed) else {
            throw LoginError.insecureURL(url)
        }
        self.baseURL = parsed
        self.session = session
    }

    static func isAcceptable(_ url: URL) -> Bool {
        switch url.scheme?.lowercased() {
        case "https":
            return url.host?.isEmpty == false
        case "http":
            return ["127.0.0.1", "::1", "localhost"].contains(url.host ?? "")
        default:
            return false
        }
    }

    /// Send email and password to OpsAPI.
    public func begin(email: String, password: String) async throws -> Step {
        let email = email.trimmingCharacters(in: .whitespaces)
        let (status, body) = try await post(
            "auth/login",
            form: [("identifier", email), ("password", password), ("app_name", "VPN10x")]
        )
        guard (200..<300).contains(status) else {
            throw OpsAPILogin.refusal(status: status, body: body, verifying: false)
        }
        guard let object = body else { throw LoginError.unreadable }
        if object["requires_2fa"] as? Bool == true, let challenge = object["session_token"] as? String {
            return .codeRequired(challenge: challenge, email: object["email"] as? String ?? email)
        }
        if let token = object["token"] as? String {
            return .token(token)
        }
        throw LoginError.refused("OpsAPI answered the sign-in with neither a token nor a code request.")
    }

    /// Send the emailed code back with the challenge from `begin`.
    public func verify(challenge: String, code: String) async throws -> String {
        let code = code.filter { !$0.isWhitespace }
        let (status, body) = try await post(
            "auth/2fa/verify",
            form: [("session_token", challenge.trimmingCharacters(in: .whitespaces)), ("code", code)]
        )
        guard (200..<300).contains(status) else {
            throw OpsAPILogin.refusal(status: status, body: body, verifying: true)
        }
        guard let token = body?["token"] as? String else {
            throw LoginError.refused("OpsAPI accepted the code but returned no token.")
        }
        return token
    }

    // MARK: - Plumbing

    private func post(_ path: String, form: [(String, String)]) async throws -> (Int, [String: Any]?) {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data(OpsAPILogin.formEncode(form).utf8)
        let (data, response) = try await session.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        return (status, object)
    }

    /// `application/x-www-form-urlencoded`, strictly: only unreserved
    /// characters pass through, so a `+` or `&` in a password arrives intact.
    static func formEncode(_ fields: [(String, String)]) -> String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        func escape(_ value: String) -> String {
            value.addingPercentEncoding(withAllowedCharacters: allowed) ?? ""
        }
        return fields.map { "\(escape($0.0))=\(escape($0.1))" }.joined(separator: "&")
    }

    /// OpsAPI's errors come as `{error: {code, message}}` or `{error: "text"}`.
    static func refusal(status: Int, body: [String: Any]?, verifying: Bool) -> LoginError {
        let envelope = body?["error"] as? [String: Any]
        let code = envelope?["code"] as? String ?? ""
        let message = (envelope?["message"] as? String)
            ?? (body?["error"] as? String)
            ?? (body?["message"] as? String)
            ?? ""
        if code == "AUTH_INVALID_CREDENTIALS" { return .invalidCredentials }
        if status == 429 || status == 423 {
            return .throttled(message.isEmpty ? "Too many attempts. Wait a while and try again." : message)
        }
        if status == 403, message.contains("deactivated") { return .deactivated }
        if status == 401, verifying { return .codeRejected }
        if !message.isEmpty { return .refused("OpsAPI: \(message)") }
        return .refused("OpsAPI refused the sign-in (HTTP \(status)).")
    }
}
