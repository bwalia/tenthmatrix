# VPN10x — iPhone, iPad and Mac

One WireGuard client for iOS and macOS: a SwiftUI app, an
`NEPacketTunnelProvider` extension, and the real wireguard-go data plane. The
iPhone/iPad app and the Mac app are built from the same sources; only bundle
metadata and entitlements differ.

People sign in with their **OpsAPI** account (email, password, emailed code)
or through the browser, whichever the control plane offers. Either way the
control plane decides — by asking OpsAPI, at sign-in and again at every
connect — whether this person is an active member of the workspace and holds
a workspace role that grants VPN access. See
[OPSAPI.md](../../docs/OPSAPI.md#signing-in-with-an-opsapi-account).

## Getting it building

```bash
brew install xcodegen go       # go builds wireguard-go; xcodegen the project
make bootstrap                 # fetch pinned WireGuard sources, generate the project
make test                      # kit tests, on a simulator
make build-device              # compile iOS app + tunnel for a device, unsigned
make build-mac                 # compile Mac app + tunnel (universal), unsigned
```

Neither `VPN10x.xcodeproj` nor the WireGuard checkout is committed. The project
is generated from `project.yml`, because a `.pbxproj` is a merge-conflict
generator and an unreviewable diff. The WireGuard sources are fetched at the
revision in `WIREGUARD_REVISION`.

## Targets

| Target | What it is | Simulator? |
| --- | --- | --- |
| `VPN10xKit` | Wire models, OpsAPI and browser sign-in, PKCE, keys, keychain, posture, validation — iOS and macOS | yes |
| `VPN10x` | The SwiftUI app, iOS | yes |
| `VPN10xTunnel` | The packet tunnel extension, iOS | **no** |
| `VPN10xMac` | The same SwiftUI app, macOS (window + menu bar) | — |
| `VPN10xMacTunnel` | The same packet tunnel, as a macOS app extension | — |
| `VPN10xKitTests` | Kit tests | yes |

`VPN10xKit` deliberately does not link WireGuardKit. WireGuardKit pulls in a Go
static library that has no simulator slice, so anything that depends on it can
only be built for a device. Keeping it on the far side of that line is what lets
the wire format, the crypto, the parsing and the validation be tested at all.

The split has a second effect worth stating: everything the app can check, the
app checks. The extension runs with no user in front of it, sometimes while the
screen is locked, and can report nothing better than "failed to start" — so
`TunnelRequest` validates at the moment someone presses Connect, and the
extension is left with only the parsing that WireGuard's own parsers must do.

## Signing in

The first screen asks for the control plane's address (an MDM can preset it
through the managed app configuration key `control_plane_url`), then asks it
which sign-in methods it offers (`GET /auth/methods`).

**With OpsAPI.** Email and password go to the OpsAPI address the control plane
advertised — HTTPS only, or loopback in development — and never to the control
plane. If the workspace sends a code, the app asks for it. The resulting OpsAPI
token is handed to `/auth/opsapi/exchange`; the control plane checks the
session, workspace membership, the person's workspace role and the SCIM
directory with OpsAPI, and issues its own token. The OpsAPI token and password
are not kept. "Signed in to OpsAPI, but this account is not allowed to use this
VPN" means OpsAPI accepted the password and the control plane did not accept
the account — usually a missing workspace role.

**With the browser.** A phone cannot listen on loopback the way the CLI does, so it registers a
private-use URI scheme — `io.vpn10x.zerotrust://callback` — which is the mechanism
RFC 8252 section 7.1 describes. **The control plane will not accept it unless
the deployment has named it:**

```yaml
identity:
  oidc:
    native_schemes:
      - io.vpn10x.zerotrust
```

Without that, sign-in fails with `redirect_uri scheme is not in
identity.oidc.native_schemes`. The allowlist exists because private-use schemes
are first come, first served: nothing stops a second app registering the same
one. PKCE means an intercepted code is worthless without the verifier, but an
operator should still decide which apps may collect a login.

The browser is `ASWebAuthenticationSession`, not a `WKWebView`. The app cannot
read that page, inject script into it, or see the credentials typed into it. An
in-app web view would give it all three, which is why it looks the same to a
user and is not.

## The Mac app

`VPN10xMac` is the same app, sandboxed, with the tunnel embedded as a macOS
**app extension** — the shape the Mac App Store and TestFlight take, and the
same `NETunnelProviderManager` flow as iOS. It opens one window and a menu bar
item with status and Connect/Disconnect. The first connect shows the system
prompt to add a VPN configuration; it then appears in System Settings › VPN.

Signing needs, in the developer portal for team `PAS2QUVJHC`: App IDs
`io.vpn10x.zerotrust.mac` and `io.vpn10x.zerotrust.mac.tunnel` with the Network
Extensions capability (packet tunnel), the app group
`PAS2QUVJHC.group.io.vpn10x.zerotrust`, and an App Store Connect record for the
Mac app. `make testflight-mac` archives and uploads with automatic signing, as
`make testflight` does for iOS.

Distributing outside the store (Developer ID, notarised) would need the tunnel
as a **system extension** (`packet-tunnel-provider-systemextension`) and an
activation step; that is not built. The existing Tauri desktop app
(`apps/vpn10x-desktop`) remains the client for Linux and Windows and for Macs
that want the CLI's fuller posture checks.

## What it can measure

iOS gives an app far less than the CLI on macOS does, and the gaps are
reported rather than filled in:

| Signal | Source |
| --- | --- |
| `disk_encryption` | whether a device passcode is set |
| `device_management` | presence of an MDM-pushed managed app configuration |
| `firewall` | `unsupported` — iOS has no host firewall |
| `os_version`, `agent_version` | `UIDevice`, bundle |

The Mac app is sandboxed, so it cannot run `fdesetup` or read the application
firewall the way the CLI agent does: `disk_encryption` and `firewall` are
`unknown` there, `device_management` works as on iOS. A policy that must know
FileVault state should require the signal, which keeps Macs on the CLI until
an MDM pushes a configuration.

`disk_encryption` deserves a note. iOS encrypts the file system
unconditionally, so "is the disk encrypted" always answers yes and means
nothing. What decides whether data is protected at rest is whether a passcode is
set — without one the class keys are available whenever the device is powered
on. That is the question the signal answers.

`device_management` is `unknown` when absent, not `fail`. A managed app
configuration proves enrolment; its absence proves nothing, because an enrolled
device whose administrator never pushed one looks identical to an unenrolled
device. A policy that needs a real answer should require the signal by name and
have the MDM push a configuration.

## What this cannot do here

**Run a tunnel on a simulator.** Network Extensions do not load in the
Simulator, at all. `make test` covers wire format, crypto, parsing and
validation; the tunnel itself needs a device.

**Install on a device without Apple's permission.** The
`com.apple.developer.networking.networkextension` entitlement with
`packet-tunnel-provider` is granted per App ID through the developer portal, on
a paid account. `make build-device` compiles and links unsigned, which proves
the code builds — it does not prove it will install.

So the honest state of this app: it compiles for iOS and macOS, both
extensions link the real wireguard-go, and everything testable off-device is
tested. Nobody has yet watched it carry a packet on either platform.

## Two upstream defects worked around

`wireguard-apple` is pinned at a 2023 revision and has not been updated for
current toolchains. Both fixes are visible rather than buried:

1. Its `Package.swift` declares `swift-tools-version:5.3` and uses `.iOS(.v15)`,
   which PackageDescription only gained in 5.5. Xcode 26's SwiftPM rejects the
   manifest. `Packages/WireGuardKit/Package.swift` is ours, declares the same
   target graph correctly, and compiles the upstream sources unmodified.

2. `WireGuardKitC.h` re-declares `struct ctl_info` and `struct sockaddr_ctl`
   using BSD type names without including `<sys/types.h>`. Implicit modules let
   that through; Xcode 26 builds Swift with explicit modules and does not.
   `patches/0001-wireguardkitc-include-sys-types.patch` adds the include, and
   `make bootstrap` fails loudly if it ever stops applying.

The Go runtime patch in WireGuard's own Makefile — `mach_continuous_time` in
place of `mach_absolute_time`, so timers keep running across a device suspend —
still applies cleanly to Go 1.26 and is left alone.
