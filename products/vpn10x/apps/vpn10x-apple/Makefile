# The VPN10x app for iPhone, iPad and Mac: one SwiftUI codebase, one packet
# tunnel, built per platform.
#
# `make bootstrap` is required once after a clone: it fetches the pinned
# WireGuard sources and generates the Xcode project, neither of which is
# committed.

REVISION  := $(shell cat WIREGUARD_REVISION)
UPSTREAM  := Packages/WireGuardKit/upstream
SIMULATOR ?= platform=iOS Simulator,name=iPhone 17 Pro

.PHONY: archive testflight archive-mac testflight-mac bootstrap upstream project test build-device build-mac clean

bootstrap: upstream project

# Fetched rather than vendored or submoduled: the pin lives in
# WIREGUARD_REVISION where it can be reviewed, the repository stays free of
# third-party sources, and a Rust-only contributor never clones any of it.
upstream:
	@if [ -d "$(UPSTREAM)/.git" ] && \
	    [ "$$(git -C $(UPSTREAM) rev-parse HEAD 2>/dev/null)" = "$(REVISION)" ]; then \
		echo "wireguard-apple already at $(REVISION)"; \
	else \
		rm -rf "$(UPSTREAM)"; \
		mkdir -p "$(UPSTREAM)"; \
		git -C "$(UPSTREAM)" init -q; \
		git -C "$(UPSTREAM)" remote add origin https://git.zx2c4.com/wireguard-apple; \
		git -C "$(UPSTREAM)" fetch -q --depth 1 origin $(REVISION); \
		git -C "$(UPSTREAM)" checkout -q FETCH_HEAD; \
		for patch in $(CURDIR)/patches/*.patch; do \
			git -C "$(UPSTREAM)" apply "$$patch" || exit 1; \
			echo "applied $$(basename $$patch)"; \
		done; \
		echo "fetched wireguard-apple at $(REVISION)"; \
	fi

project:
	xcodegen generate

# Runs on a simulator, which is possible only because VPN10xKit does not link the
# Go library. Everything asserted here is wire format, crypto and parsing.
test:
	xcodebuild test \
		-project VPN10x.xcodeproj \
		-scheme VPN10xKit \
		-destination '$(SIMULATOR)' \
		| xcbeautify 2>/dev/null || xcodebuild test \
		-project VPN10x.xcodeproj \
		-scheme VPN10xKit \
		-destination '$(SIMULATOR)'

# The tunnel links libwg-go.a, which has no simulator slice, so the only way to
# compile it is for a device. Signing is off: this proves it builds, not that it
# can be installed.
build-device:
	xcodebuild build \
		-project VPN10x.xcodeproj \
		-scheme VPN10x \
		-destination 'generic/platform=iOS' \
		CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""

# The Mac app and its tunnel extension, universal (arm64 + x86_64), unsigned.
# Unlike iOS there is no simulator split: this links the real wireguard-go.
build-mac:
	xcodebuild build \
		-project VPN10x.xcodeproj \
		-scheme VPN10xMac \
		-destination 'generic/platform=macOS' \
		CODE_SIGNING_ALLOWED=NO

# TestFlight: archive with automatic signing (registers the app, tunnel
# extension, App Group and Network Extension capability on first run), then
# export and upload to App Store Connect. Needs an Apple ID for team PAS2QUVJHC
# signed in to Xcode, and the app record (bundle id io.vpn10x.zerotrust.ios)
# created once in App Store Connect. Build numbers are managed on upload.
#
# Without an Apple ID in Xcode, sign with an App Store Connect API key (Admin):
#   make testflight ASC_KEY_ID=… ASC_ISSUER_ID=…
# The key is read from ~/.appstoreconnect/private_keys/AuthKey_<id>.p8.
ARCHIVE := build/VPN10x.xcarchive
ASC_KEY_PATH ?= $(HOME)/.appstoreconnect/private_keys/AuthKey_$(ASC_KEY_ID).p8
ASC_AUTH := $(if $(ASC_KEY_ID),-authenticationKeyPath $(ASC_KEY_PATH) -authenticationKeyID $(ASC_KEY_ID) -authenticationKeyIssuerID $(ASC_ISSUER_ID))

archive:
	xcodebuild archive \
		-project VPN10x.xcodeproj \
		-scheme VPN10x \
		-destination 'generic/platform=iOS' \
		-archivePath $(ARCHIVE) \
		-allowProvisioningUpdates $(ASC_AUTH) \
		CODE_SIGN_STYLE=Automatic

testflight: archive
	xcodebuild -exportArchive \
		-archivePath $(ARCHIVE) \
		-exportOptionsPlist ExportOptions.plist \
		-exportPath build/export \
		-allowProvisioningUpdates $(ASC_AUTH)

# The Mac app goes to TestFlight / the Mac App Store the same way, under its
# own record (bundle id io.vpn10x.zerotrust.mac). Same signing options.
MAC_ARCHIVE := build/VPN10xMac.xcarchive

archive-mac:
	xcodebuild archive \
		-project VPN10x.xcodeproj \
		-scheme VPN10xMac \
		-destination 'generic/platform=macOS' \
		-archivePath $(MAC_ARCHIVE) \
		-allowProvisioningUpdates $(ASC_AUTH) \
		CODE_SIGN_STYLE=Automatic

testflight-mac: archive-mac
	xcodebuild -exportArchive \
		-archivePath $(MAC_ARCHIVE) \
		-exportOptionsPlist ExportOptions.plist \
		-exportPath build/export-mac \
		-allowProvisioningUpdates $(ASC_AUTH)

clean:
	rm -rf VPN10x.xcodeproj $(UPSTREAM)
