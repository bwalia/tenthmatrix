import AuthenticationServices
import Foundation
import NetworkExtension
import Observation
import SwiftUI
import VPN10xKit

/// Everything the UI reads, and the only place that decides what is true.
///
/// The connected/disconnected state is read from `NEVPNStatus` — the system's
/// view — rather than from whether a session was created. Holding a session is
/// not the same as having a tunnel, and the desktop client learned that the
/// expensive way.
@MainActor
@Observable
public final class AppModel {
    public enum Phase: Equatable {
        case loading
        case signedOut
        case signedIn
    }

    public var phase: Phase = .loading
    public var email: String?
    public var networks: [Network] = []
    public var selectedNetwork: Network?
    public var posture: [PostureSignal] = []
    public var tunnelStatus: NEVPNStatus = .invalid
    public var sessionState: TunnelState?
    public var errorMessage: String?
    public var busy = false

    /// What the configured control plane offers; nil until it has answered.
    public var signInMethods: SignInMethods?
    /// Set while OpsAPI waits for the code it emailed.
    public var pendingOpsAPICode: PendingCode?

    public struct PendingCode: Equatable {
        public let challenge: String
        public let email: String
        let opsapiURL: String
    }

    /// The control plane's address as typed. Persisted under the key an MDM's
    /// managed configuration or Settings writes, so either can preset it.
    public var controlPlaneAddress: String {
        didSet {
            UserDefaults.standard.set(controlPlaneAddress, forKey: "control_plane_url")
            signInMethods = nil
        }
    }

    public var postureSummary: String { Posture.summarise(posture) }

    private let keychain = Keychain(accessGroup: AppModel.keychainAccessGroup)
    private let shared = SharedStore()
    private let tunnel = TunnelController()
    private var client: ControlPlaneClient?
    private var deviceID: UUID?
    private var statusObserver: NSObjectProtocol?

    /// Matches the entitlement on both targets. A mismatch shows up as the
    /// extension being unable to read the private key, which is confusing, so
    /// it is written once and shared.
    static let keychainAccessGroup = "io.vpn10x.zerotrust"

    /// Whether the configured control plane is on this machine.
    ///
    /// Mirrors the rule the control plane enforces on itself: it refuses to
    /// serve `/auth/dev/login` unless its own public URL is loopback. Checking
    /// the same thing here means the app never offers a sign-in that cannot
    /// work, and never offers one against a real deployment.
    public var controlPlaneIsLocal: Bool {
        guard let host = controlPlaneURL.host else { return false }
        return ["127.0.0.1", "::1", "localhost"].contains(host)
    }

    public var controlPlaneURL: URL {
        // The default is the loopback address a developer runs the control
        // plane on. A trailing slash keeps relative paths under any prefix.
        let typed = controlPlaneAddress.trimmingCharacters(in: .whitespaces)
        guard !typed.isEmpty, var url = URL(string: typed), url.host != nil else {
            return URL(string: "http://127.0.0.1:8080/")!
        }
        if !url.absoluteString.hasSuffix("/") { url = URL(string: url.absoluteString + "/") ?? url }
        return url
    }

    public init() {
        controlPlaneAddress = UserDefaults.standard.string(forKey: "control_plane_url") ?? ""
        observeTunnelStatus()
    }

    // No deinit removing the observer: the model lives as long as the app, and
    // reaching a main-actor property from a nonisolated deinit is not something
    // to work around for an object that is never torn down.

    // MARK: - Lifecycle

    public func start() async {
        posture = Posture.collect()
        sessionState = shared.tunnelState
        try? await tunnel.load()
        tunnelStatus = tunnel.status

        guard let token = keychain.get(.accessToken) else {
            phase = .signedOut
            await refreshSignInMethods()
            return
        }
        client = ControlPlaneClient(baseURL: controlPlaneURL, accessToken: token)
        phase = .signedIn
        await refreshNetworks()
    }

    /// Ask the control plane which sign-in methods to show.
    public func refreshSignInMethods() async {
        let client = ControlPlaneClient(baseURL: controlPlaneURL)
        do {
            signInMethods = try await client.signInMethods()
        } catch {
            signInMethods = nil
            // Nothing typed yet is a first launch, not a failure worth a red line.
            guard !controlPlaneAddress.isEmpty else { return }
            errorMessage = "Could not reach the control plane at \(controlPlaneURL.absoluteString): \(error.localizedDescription)"
        }
    }

    public func signIn(anchor: ASPresentationAnchor) async {
        await perform {
            let client = ControlPlaneClient(baseURL: self.controlPlaneURL)
            let token = try await BrowserLogin(anchor: anchor)
                .signIn(controlPlane: self.controlPlaneURL, client: client)
            try await self.completeSignIn(token, client: client)
        }
    }

    /// Sign in with an OpsAPI email and password.
    ///
    /// The password goes to the OpsAPI address the control plane advertised,
    /// never to the control plane. If the workspace requires a code, this stops
    /// at `pendingOpsAPICode` and `verifyOpsAPICode` finishes.
    public func signInWithOpsAPI(email: String, password: String) async {
        guard let method = signInMethods?.opsapi else { return }
        await perform {
            let login = try OpsAPILogin(url: method.url)
            switch try await login.begin(email: email, password: password) {
            case .token(let token):
                try await self.exchange(opsapiToken: token)
            case .codeRequired(let challenge, let shownEmail):
                self.pendingOpsAPICode = PendingCode(
                    challenge: challenge, email: shownEmail, opsapiURL: method.url
                )
            }
        }
    }

    public func verifyOpsAPICode(_ code: String) async {
        guard let pending = pendingOpsAPICode else { return }
        await perform {
            let login = try OpsAPILogin(url: pending.opsapiURL)
            let token = try await login.verify(challenge: pending.challenge, code: code)
            try await self.exchange(opsapiToken: token)
            self.pendingOpsAPICode = nil
        }
    }

    public func cancelOpsAPICode() {
        pendingOpsAPICode = nil
        errorMessage = nil
    }

    /// The control plane asks OpsAPI about the token — session, workspace
    /// membership, role, directory status — and issues its own. The OpsAPI
    /// token is not kept.
    private func exchange(opsapiToken: String) async throws {
        let client = ControlPlaneClient(baseURL: controlPlaneURL)
        let token = try await client.exchangeOpsAPI(token: opsapiToken)
        try await completeSignIn(token, client: client)
    }

    private func completeSignIn(_ token: TokenResponse, client: ControlPlaneClient) async throws {
        try keychain.set(token.accessToken, for: .accessToken)
        await client.setAccessToken(token.accessToken)
        self.client = client
        email = token.email
        phase = .signedIn

        try await registerDevice()
        await refreshNetworks()
    }

    /// Sign in against a local development control plane.
    ///
    /// The identity provider in the Compose stack is reachable only from inside
    /// the docker network, so the browser flow cannot complete from a simulator.
    /// This is the same door the CLI's `--dev` opens, and the control plane
    /// guards it the same way: it answers only when bound to loopback.
    public func signInWithDevLogin(email: String) async {
        guard controlPlaneIsLocal else { return }
        await perform {
            let client = ControlPlaneClient(baseURL: self.controlPlaneURL)
            let token = try await client.devLogin(email: email)
            try await self.completeSignIn(token, client: client)
        }
    }

    public func signOut() async {
        await perform {
            try? await self.tunnel.stop()
            self.keychain.remove(.accessToken)
            // The WireGuard private key stays: the gateway still knows this
            // device by its public half, and throwing it away would orphan that
            // registration for no gain.
            self.shared.tunnelState = nil
            self.client = nil
            self.email = nil
            self.networks = []
            self.sessionState = nil
            self.phase = .signedOut
        }
        await refreshSignInMethods()
    }

    // MARK: - Networks and sessions

    public func refreshNetworks() async {
        guard let client else { return }
        do {
            networks = try await client.networks()
            if selectedNetwork == nil { selectedNetwork = networks.first }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    public func connect() async {
        // Returning silently here is how a button press becomes nothing at all.
        // Both of these are states a user can reach — signed out by an expired
        // token, or pressing Connect before the network list has arrived — and
        // both deserve a sentence rather than a shrug.
        guard let client else {
            errorMessage = ControlPlaneClient.ClientError.notSignedIn.localizedDescription
            return
        }
        guard let network = selectedNetwork else {
            errorMessage = "No network selected yet. Pull to refresh if the list is empty."
            return
        }
        await perform {
            let deviceID = try await self.ensureDevice()
            self.posture = Posture.collect()

            let response: CreateSessionResponse
            do {
                response = try await client.createSession(
                    CreateSessionRequest(
                        networkId: network.id,
                        deviceId: deviceID,
                        posture: self.posture
                    )
                )
            } catch ControlPlaneClient.ClientError.http(status: 403, body: _) {
                // The control plane answers every refusal with a bare 403 and
                // keeps the reason in its audit log, so name the possibilities.
                throw SessionError.refused
            }
            guard response.decision.allow else {
                throw SessionError.denied(response.decision.reason)
            }

            let keypair = try self.keychain.wireguardKeypair()
            let request = try TunnelRequest(
                config: response.wireguard,
                privateKey: keypair.privateKey,
                networkName: network.name
            )
            try await self.tunnel.start(
                request: request,
                serverDescription: response.wireguard.peerEndpoint
            )

            self.shared.tunnelState = TunnelState(
                networkName: network.name,
                assignedIP: response.session.assignedIp,
                expiresAt: response.session.expiresAt
            )
            self.sessionState = self.shared.tunnelState
        }
    }

    public func disconnect() async {
        await perform {
            try await self.tunnel.stop()
            self.shared.tunnelState = nil
            self.sessionState = nil
        }
    }

    // MARK: - Plumbing

    private func ensureDevice() async throws -> UUID {
        if let deviceID { return deviceID }
        return try await registerDevice()
    }

    @discardableResult
    private func registerDevice() async throws -> UUID {
        guard let client else { throw ControlPlaneClient.ClientError.notSignedIn }
        let keypair = try keychain.wireguardKeypair()
        let response = try await client.registerDevice(
            RegisterDeviceRequest(
                name: DeviceInfo.name,
                platform: DeviceInfo.platform,
                osVersion: DeviceInfo.osVersion,
                agentVersion: Bundle.main.shortVersion,
                wireguardPublicKey: keypair.publicKey,
                posture: posture
            )
        )
        deviceID = response.device.id
        return response.device.id
    }

    private func observeTunnelStatus() {
        statusObserver = NotificationCenter.default.addObserver(
            forName: .NEVPNStatusDidChange,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.tunnelStatus = self.tunnel.status
            }
        }
    }

    private func perform(_ work: @escaping () async throws -> Void) async {
        busy = true
        errorMessage = nil
        do {
            try await work()
        } catch {
            errorMessage = error.localizedDescription
        }
        tunnelStatus = tunnel.status
        busy = false
    }

    enum SessionError: Error, LocalizedError {
        case denied(String)
        case refused

        var errorDescription: String? {
            switch self {
            case .denied(let reason):
                return "Access denied: \(reason)"
            case .refused:
                return """
                    Access denied. Your OpsAPI account may no longer be active \
                    or hold a role that grants VPN access, policy may not allow \
                    this network, or this device was revoked. Your administrator \
                    can see which in the audit log.
                    """
            }
        }
    }
}
