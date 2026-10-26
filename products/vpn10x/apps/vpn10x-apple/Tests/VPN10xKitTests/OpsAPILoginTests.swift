import Foundation
import Testing
@testable import VPN10xKit

/// Answers requests the way OpsAPI's `routes/auth.lua` does: forms only, an
/// emailed code for alice, none for bob, and its error envelope for a wrong
/// password. The same fixture as `vpn10x-agent/src/opsapi.rs`'s tests.
final class FakeOpsAPI: URLProtocol {
    nonisolated(unsafe) static var lastRequest: URLRequest?
    nonisolated(unsafe) static var lastBody: String = ""

    static func session() -> URLSession {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [FakeOpsAPI.self]
        return URLSession(configuration: configuration)
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let body = Self.bodyText(of: request)
        Self.lastRequest = request
        Self.lastBody = body
        let form = Self.parse(body)
        let isForm = request.value(forHTTPHeaderField: "Content-Type") == "application/x-www-form-urlencoded"

        let (status, json): (Int, String)
        switch (request.url?.path, isForm) {
        case (_, false):
            (status, json) = (400, #"{"error":{"code":"VALIDATION_400","message":"identifier is required"}}"#)
        case ("/auth/login", true) where form["password"] != "right p&ss+word":
            (status, json) = (401, #"{"error":{"code":"AUTH_INVALID_CREDENTIALS","message":"Invalid credentials"}}"#)
        case ("/auth/login", true) where form["identifier"] == "alice@example.com":
            (status, json) = (200, #"{"requires_2fa":true,"session_token":"challenge-1","email":"a***e@example.com"}"#)
        case ("/auth/login", true):
            (status, json) = (200, #"{"token":"opsapi-token-bob"}"#)
        case ("/auth/2fa/verify", true) where form["session_token"] == "challenge-1" && form["code"] == "123456":
            (status, json) = (200, #"{"token":"opsapi-token-alice"}"#)
        case ("/auth/2fa/verify", true):
            (status, json) = (401, #"{"error":"Invalid code"}"#)
        default:
            (status, json) = (404, "{}")
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(json.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}

    /// URLSession hands a protocol the body as a stream, not as `httpBody`.
    static func bodyText(of request: URLRequest) -> String {
        if let data = request.httpBody { return String(decoding: data, as: UTF8.self) }
        guard let stream = request.httpBodyStream else { return "" }
        stream.open()
        defer { stream.close() }
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 1024)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: buffer.count)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return String(decoding: data, as: UTF8.self)
    }

    static func parse(_ body: String) -> [String: String] {
        var fields: [String: String] = [:]
        for pair in body.split(separator: "&") {
            let parts = pair.split(separator: "=", maxSplits: 1).map(String.init)
            guard parts.count == 2 else { continue }
            fields[parts[0].removingPercentEncoding ?? parts[0]] = parts[1].removingPercentEncoding ?? parts[1]
        }
        return fields
    }
}

@Suite(.serialized) struct OpsAPILoginTests {
    let login = try! OpsAPILogin(url: "https://opsapi.example.com", session: FakeOpsAPI.session())

    /// A password is about to be sent there.
    @Test func onlyHTTPSOrThisMachineIsAcceptable() {
        #expect(throws: Never.self) { try OpsAPILogin(url: "https://api.example.com") }
        #expect(throws: Never.self) { try OpsAPILogin(url: "http://127.0.0.1:4077") }
        #expect(throws: OpsAPILogin.LoginError.self) { try OpsAPILogin(url: "http://api.example.com") }
        #expect(throws: OpsAPILogin.LoginError.self) { try OpsAPILogin(url: "ftp://api.example.com") }
        #expect(throws: OpsAPILogin.LoginError.self) { try OpsAPILogin(url: "not a url") }
    }

    /// `+` would arrive as a space and `&` would split the field — which in a
    /// password means a sign-in that fails for no visible reason.
    @Test func formEncodingKeepsAValueIntact() {
        let encoded = OpsAPILogin.formEncode([("field", "a+b&c=d e")])
        #expect(encoded == "field=a%2Bb%26c%3Dd%20e")
        #expect(FakeOpsAPI.parse(encoded)["field"] == "a+b&c=d e")
    }

    @Test func aWorkspaceWithoutCodesSignsStraightIn() async throws {
        let step = try await login.begin(email: " bob@example.com ", password: "right p&ss+word")
        #expect(step == .token("opsapi-token-bob"))
        #expect(FakeOpsAPI.lastRequest?.url?.path == "/auth/login")
        #expect(FakeOpsAPI.parse(FakeOpsAPI.lastBody)["identifier"] == "bob@example.com")
    }

    @Test func anEmailedCodeIsAskedForThenRedeemed() async throws {
        let step = try await login.begin(email: "alice@example.com", password: "right p&ss+word")
        #expect(step == .codeRequired(challenge: "challenge-1", email: "a***e@example.com"))

        let token = try await login.verify(challenge: "challenge-1", code: "123 456")
        #expect(token == "opsapi-token-alice")
    }

    @Test func aWrongPasswordSaysSo() async {
        await #expect(throws: OpsAPILogin.LoginError.invalidCredentials) {
            try await login.begin(email: "bob@example.com", password: "wrong")
        }
    }

    @Test func aWrongCodeSaysSo() async {
        await #expect(throws: OpsAPILogin.LoginError.codeRejected) {
            try await login.verify(challenge: "challenge-1", code: "000000")
        }
    }

    @Test func refusalsAreReadFromEitherErrorShape() {
        #expect(OpsAPILogin.refusal(status: 429, body: nil, verifying: false)
                == .throttled("Too many attempts. Wait a while and try again."))
        #expect(OpsAPILogin.refusal(status: 403, body: ["error": "Account deactivated"], verifying: false)
                == .deactivated)
        #expect(OpsAPILogin.refusal(status: 500, body: ["error": ["message": "boom"]], verifying: false)
                == .refused("OpsAPI: boom"))
        #expect(OpsAPILogin.refusal(status: 502, body: nil, verifying: false)
                == .refused("OpsAPI refused the sign-in (HTTP 502)."))
    }

    @Test func signInMethodsDecodeWithAndWithoutOpsAPI() throws {
        let both = try Wire.decoder().decode(
            SignInMethods.self,
            from: Data(#"{"oidc":true,"opsapi":{"url":"https://api.example.com","namespace":"workstation"}}"#.utf8)
        )
        #expect(both.opsapi?.namespace == "workstation")
        #expect(both.opsapi?.rolesRequired == nil)
        let gated = try Wire.decoder().decode(
            SignInMethods.self,
            from: Data(#"{"oidc":true,"opsapi":{"url":"https://api.example.com","namespace":"w","roles_required":true}}"#.utf8)
        )
        #expect(gated.opsapi?.rolesRequired == true)
        let browser = try Wire.decoder().decode(SignInMethods.self, from: Data(#"{"oidc":true,"opsapi":null}"#.utf8))
        #expect(browser == .browserOnly)
    }
}
