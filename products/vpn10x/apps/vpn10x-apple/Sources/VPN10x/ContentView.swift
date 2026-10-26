import AuthenticationServices
import SwiftUI
import VPN10xKit

struct ContentView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        NavigationStack {
            Group {
                switch model.phase {
                case .loading:
                    ProgressView("Loading")
                case .signedOut:
                    SignInView()
                case .signedIn:
                    StatusView()
                }
            }
            .navigationTitle("VPN10x")
        }
    }
}

struct SignInView: View {
    @Environment(AppModel.self) private var model
    @State private var devEmail = "alice@example.com"

    var body: some View {
        @Bindable var model = model

        ScrollView {
            VStack(spacing: 20) {
                Image(systemName: "lock.shield")
                    .font(.system(size: 56))
                    .foregroundStyle(.tint)
                    .padding(.top, 24)
                Text("Secure access to your organisation's services")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 6) {
                    Text("Control plane")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("https://vpn.example.com", text: $model.controlPlaneAddress)
                        .textFieldStyle(.roundedBorder)
                        .plainTextEntry()
                        .onSubmit { Task { await model.refreshSignInMethods() } }
                        .accessibilityIdentifier("control-plane-url")
                }

                switch model.signInMethods {
                case nil:
                    Button("Continue") { Task { await model.refreshSignInMethods() } }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .disabled(model.busy)
                case let methods?:
                    if let opsapi = methods.opsapi {
                        OpsAPISignInView(method: opsapi)
                    }
                    if methods.oidc {
                        if methods.opsapi != nil {
                            Text("or").font(.caption).foregroundStyle(.secondary)
                        }
                        Button {
                            Task { await model.signIn(anchor: presentationAnchor()) }
                        } label: {
                            Text("Sign in with browser")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.large)
                        .disabled(model.busy)
                    }
                }

                // Only against a control plane on this machine, which is the same
                // condition under which the control plane will answer at all.
                if model.controlPlaneIsLocal {
                    VStack(spacing: 6) {
                        Divider()
                        Text("Development")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("you@example.com", text: $devEmail)
                            .textFieldStyle(.roundedBorder)
                            .plainTextEntry()
                        Button("Developer sign-in") {
                            Task { await model.signInWithDevLogin(email: devEmail) }
                        }
                        .buttonStyle(.bordered)
                        .disabled(model.busy || devEmail.isEmpty)
                        .accessibilityIdentifier("dev-sign-in")
                    }
                    .padding(.top, 8)
                }

                ErrorText()
            }
            .padding()
            .frame(maxWidth: 420)
            .frame(maxWidth: .infinity)
        }
    }
}

/// Email and password, then the emailed code if the workspace asks for one.
///
/// The password is sent to the OpsAPI address the control plane advertised
/// and nowhere else; the control plane decides afterwards — by asking OpsAPI —
/// whether this account's workspace role lets it on the VPN at all.
struct OpsAPISignInView: View {
    @Environment(AppModel.self) private var model
    let method: OpsAPIMethod

    @State private var email = ""
    @State private var password = ""
    @State private var code = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Sign in with OpsAPI")
                .font(.headline)
            Text("Workspace: \(method.namespace)")
                .font(.caption)
                .foregroundStyle(.secondary)
            if method.rolesRequired == true {
                Text("Access needs a VPN role in this workspace.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let pending = model.pendingOpsAPICode {
                Text("Enter the code sent to \(pending.email).")
                    .font(.callout)
                TextField("Code", text: $code)
                    .textFieldStyle(.roundedBorder)
                    .oneTimeCodeEntry()
                    .accessibilityIdentifier("opsapi-code")
                HStack {
                    Button("Back") {
                        code = ""
                        model.cancelOpsAPICode()
                    }
                    .buttonStyle(.bordered)
                    Spacer()
                    Button("Verify") {
                        Task { await model.verifyOpsAPICode(code) }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(model.busy || code.isEmpty)
                    .accessibilityIdentifier("opsapi-verify")
                }
            } else {
                TextField("Email", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .plainTextEntry()
                    .textContentType(.username)
                    .accessibilityIdentifier("opsapi-email")
                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.password)
                    .accessibilityIdentifier("opsapi-password")
                Button {
                    Task {
                        await model.signInWithOpsAPI(email: email, password: password)
                        // The password is no use once OpsAPI has answered, either way.
                        password = ""
                    }
                } label: {
                    Text("Sign in").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(model.busy || email.isEmpty || password.isEmpty)
                .accessibilityIdentifier("opsapi-sign-in")
            }
        }
    }
}

struct StatusView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        @Bindable var model = model

        List {
            Section {
                LabeledContent("Status", value: model.tunnelStatus.label)
                    .accessibilityIdentifier("tunnel-status")
                if let state = model.sessionState {
                    LabeledContent("Network", value: state.networkName)
                    LabeledContent("Address", value: state.assignedIP)
                    LabeledContent("Expires", value: state.expiresAt.formatted(date: .abbreviated, time: .shortened))
                }
                if let email = model.email {
                    LabeledContent("Signed in", value: email)
                }
            }

            // Directly under the status, not in the footer of the last section.
            // An error from pressing Connect belongs where it can be read
            // without scrolling past everything else to find it.
            if model.errorMessage != nil {
                Section { ErrorText() }
            }

            Section("Posture") {
                LabeledContent("Summary", value: model.postureSummary)
                ForEach(model.posture) { signal in
                    PostureRow(signal: signal)
                }
            }

            if model.tunnelStatus != .connected {
                Section("Connect") {
                    if model.networks.count > 1 {
                        Picker("Network", selection: $model.selectedNetwork) {
                            ForEach(model.networks) { network in
                                Text(network.name).tag(Optional(network))
                            }
                        }
                    }
                    Button("Connect") { Task { await model.connect() } }
                        .disabled(model.busy || model.selectedNetwork == nil)
                        .accessibilityIdentifier("connect")
                }
            } else {
                Section {
                    Button("Disconnect", role: .destructive) {
                        Task { await model.disconnect() }
                    }
                    .disabled(model.busy)
                }
            }

            Section {
                Button("Sign out") { Task { await model.signOut() } }
                    .disabled(model.busy)
                    .accessibilityIdentifier("sign-out")
            }
        }
        .refreshable { await model.refreshNetworks() }
        #if os(macOS)
        // No pull-to-refresh on a Mac.
        .toolbar {
            Button {
                Task { await model.refreshNetworks() }
            } label: {
                Label("Refresh", systemImage: "arrow.clockwise")
            }
            .disabled(model.busy)
        }
        #endif
    }
}

struct PostureRow: View {
    let signal: PostureSignal

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Image(systemName: symbol)
                .foregroundStyle(tint)
                .accessibilityLabel(signal.result.rawValue)
            VStack(alignment: .leading, spacing: 2) {
                Text(signal.name.replacingOccurrences(of: "_", with: " ").capitalized)
                if let detail = signal.detail {
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var symbol: String {
        switch signal.result {
        case .pass: return "checkmark.circle.fill"
        case .fail: return "xmark.circle.fill"
        case .unknown: return "questionmark.circle.fill"
        case .unsupported: return "minus.circle"
        }
    }

    private var tint: Color {
        switch signal.result {
        case .pass: return .green
        case .fail: return .red
        case .unknown: return .orange
        case .unsupported: return .secondary
        }
    }
}

struct ErrorText: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        if let message = model.errorMessage {
            Text(message)
                .font(.footnote)
                .foregroundStyle(.red)
                .accessibilityIdentifier("error-text")
        }
    }
}

/// Where the browser sign-in sheet attaches: the key window on a Mac, a fresh
/// anchor on iOS as before.
@MainActor
func presentationAnchor() -> ASPresentationAnchor {
    #if os(macOS)
    return NSApplication.shared.keyWindow ?? ASPresentationAnchor()
    #else
    return ASPresentationAnchor()
    #endif
}

extension View {
    /// Addresses and emails: no capitalisation, no autocorrect.
    @ViewBuilder
    func plainTextEntry() -> some View {
        #if os(iOS)
        self.textInputAutocapitalization(.never).autocorrectionDisabled()
        #else
        self.autocorrectionDisabled()
        #endif
    }

    @ViewBuilder
    func oneTimeCodeEntry() -> some View {
        #if os(iOS)
        self.textContentType(.oneTimeCode).keyboardType(.numberPad)
        #else
        self.textContentType(.oneTimeCode)
        #endif
    }
}
