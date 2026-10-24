# The iOS app.
#
# `make bootstrap` is required once after a clone: it fetches the pinned
# WireGuard sources and generates the Xcode project, neither of which is
# committed.

REVISION  := $(shell cat WIREGUARD_REVISION)
UPSTREAM  := Packages/WireGuardKit/upstream
SIMULATOR := platform=iOS Simulator,name=iPhone 17

.PHONY: archive testflight bootstrap upstream project test build-device clean

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

# TestFlight: archive with automatic signing (registers the app, tunnel
# extension, App Group and Network Extension capability on first run), then
# export and upload to App Store Connect. Needs an Apple ID for team PAS2QUVJHC
# signed in to Xcode, and the app record (bundle id io.vpn10x.zerotrust.ios)
# created once in App Store Connect. Build numbers are managed on upload.
ARCHIVE := build/VPN10x.xcarchive

archive:
	xcodebuild archive \
		-project VPN10x.xcodeproj \
		-scheme VPN10x \
		-destination 'generic/platform=iOS' \
		-archivePath $(ARCHIVE) \
		-allowProvisioningUpdates \
		CODE_SIGN_STYLE=Automatic

testflight: archive
	xcodebuild -exportArchive \
		-archivePath $(ARCHIVE) \
		-exportOptionsPlist ExportOptions.plist \
		-exportPath build/export \
		-allowProvisioningUpdates

clean:
	rm -rf VPN10x.xcodeproj $(UPSTREAM)
