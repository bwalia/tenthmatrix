import SwiftUI
import VPN10xKit

@main
struct VPN10xApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        #if os(macOS)
        // One window: a second copy of the same tunnel controls helps no one.
        Window("VPN10x", id: "main") {
            ContentView()
                .environment(model)
                .task { await model.start() }
                .frame(minWidth: 380, minHeight: 520)
        }
        .defaultSize(width: 420, height: 640)
        #else
        WindowGroup {
            ContentView()
                .environment(model)
                .task { await model.start() }
        }
        #endif

        #if os(macOS)
        // A VPN on a Mac lives in the menu bar: status at a glance, and
        // connect or disconnect without opening the window.
        MenuBarExtra {
            MenuBarContent()
                .environment(model)
        } label: {
            Image(systemName: model.tunnelStatus == .connected ? "lock.shield.fill" : "lock.shield")
        }
        #endif
    }
}

#if os(macOS)
struct MenuBarContent: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        Text("VPN10x: \(model.tunnelStatus.label)")
        if let state = model.sessionState, model.tunnelStatus == .connected {
            Text("\(state.networkName) · \(state.assignedIP)")
        }
        Divider()
        if model.phase == .signedIn {
            if model.tunnelStatus == .connected {
                Button("Disconnect") { Task { await model.disconnect() } }
                    .disabled(model.busy)
            } else {
                Button("Connect\(model.selectedNetwork.map { " to \($0.name)" } ?? "")") {
                    Task { await model.connect() }
                }
                .disabled(model.busy || model.selectedNetwork == nil)
            }
        }
        Button("Open VPN10x") {
            openWindow(id: "main")
            NSApplication.shared.activate()
        }
        Divider()
        Button("Quit") { NSApplication.shared.terminate(nil) }
            .keyboardShortcut("q")
    }
}
#endif
