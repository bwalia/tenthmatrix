import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// How this device introduces itself when it registers.
///
/// `platform` uses the agent's names (`std::env::consts::OS`), so a Mac running
/// this app and a Mac running the CLI are the same kind of device to policy.
public enum DeviceInfo {
    #if os(macOS)
    public static let platform = "macos"
    #else
    public static let platform = "ios"
    #endif

    @MainActor
    public static var name: String {
        #if canImport(UIKit)
        return UIDevice.current.name
        #else
        return Host.current().localizedName ?? ProcessInfo.processInfo.hostName
        #endif
    }

    @MainActor
    public static var osVersion: String {
        #if canImport(UIKit)
        return UIDevice.current.systemVersion
        #else
        let version = ProcessInfo.processInfo.operatingSystemVersion
        return "\(version.majorVersion).\(version.minorVersion).\(version.patchVersion)"
        #endif
    }
}
