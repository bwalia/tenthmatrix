# ============================================================================
# Registry10x Multi-Stage Dockerfile
# Builds the registry10x-auth, registry10x-registry, registry10x-scanner and
# registry10x-controller (operator) binaries into a single image.
# ============================================================================

# ── Builder stage ────────────────────────────────────────────────────────────

FROM rust:1.94-bookworm AS builder

WORKDIR /build

# Cache dependency compilation: copy manifests first, then build a dummy
# project so that changing application source does not invalidate the
# dependency layer.
COPY Cargo.toml Cargo.lock ./
COPY crates/registry10x-common/Cargo.toml      crates/registry10x-common/Cargo.toml
COPY crates/registry10x-auth/Cargo.toml        crates/registry10x-auth/Cargo.toml
COPY crates/registry10x-registry/Cargo.toml    crates/registry10x-registry/Cargo.toml
COPY crates/registry10x-controller/Cargo.toml  crates/registry10x-controller/Cargo.toml
COPY crates/registry10x-resilience/Cargo.toml  crates/registry10x-resilience/Cargo.toml
COPY crates/registry10x-mirror/Cargo.toml      crates/registry10x-mirror/Cargo.toml
COPY crates/registry10x-replication/Cargo.toml crates/registry10x-replication/Cargo.toml
COPY crates/registry10x-db/Cargo.toml          crates/registry10x-db/Cargo.toml
COPY crates/registry10x-ai/Cargo.toml          crates/registry10x-ai/Cargo.toml
COPY crates/registry10x-scanner/Cargo.toml     crates/registry10x-scanner/Cargo.toml

# Create stub source files so Cargo can resolve the workspace
RUN mkdir -p crates/registry10x-common/src      && echo "pub fn _stub(){}" > crates/registry10x-common/src/lib.rs \
 && mkdir -p crates/registry10x-auth/src        && echo "fn main(){}" > crates/registry10x-auth/src/main.rs \
 && mkdir -p crates/registry10x-registry/src    && echo "fn main(){}" > crates/registry10x-registry/src/main.rs \
 && mkdir -p crates/registry10x-controller/src  && echo "fn main(){}" > crates/registry10x-controller/src/main.rs \
 && mkdir -p crates/registry10x-resilience/src  && echo "pub fn _stub(){}" > crates/registry10x-resilience/src/lib.rs \
 && mkdir -p crates/registry10x-mirror/src      && echo "pub fn _stub(){}" > crates/registry10x-mirror/src/lib.rs \
 && mkdir -p crates/registry10x-replication/src && echo "pub fn _stub(){}" > crates/registry10x-replication/src/lib.rs \
 && mkdir -p crates/registry10x-db/src          && echo "pub fn _stub(){}" > crates/registry10x-db/src/lib.rs \
 && mkdir -p crates/registry10x-ai/src          && echo "pub fn _stub(){}" > crates/registry10x-ai/src/lib.rs \
 && mkdir -p crates/registry10x-scanner/src     && echo "pub fn _stub(){}" > crates/registry10x-scanner/src/lib.rs \
 && mkdir -p crates/registry10x-scanner/src/bin && echo "fn main(){}" > crates/registry10x-scanner/src/bin/registry10x-scanner.rs

# Build dependencies only (this layer is cached unless Cargo.toml/lock change)
RUN cargo build --release --workspace 2>&1 || true

# Remove the stub artifacts so the real source gets compiled
RUN rm -rf crates/registry10x-common/src crates/registry10x-auth/src crates/registry10x-registry/src \
    crates/registry10x-controller/src crates/registry10x-resilience/src crates/registry10x-mirror/src \
    crates/registry10x-replication/src crates/registry10x-db/src crates/registry10x-ai/src \
    crates/registry10x-scanner/src \
 && rm -rf target/release/.fingerprint/registry10x-*

# Copy the actual source code
COPY crates/ crates/

# Build the real binaries. Build metadata (version / SHA / time) is injected
# in the runtime stage instead of here, so a new commit SHA does NOT invalidate
# this expensive compile layer.
RUN cargo build --release --bin registry10x-auth --bin registry10x-registry --bin registry10x-scanner \
    --bin registry10x-controller

# ── Runtime stage ────────────────────────────────────────────────────────────

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        tini \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 10001 registry10x \
 && useradd --uid 10001 --gid registry10x --shell /sbin/nologin --create-home registry10x

# Create directories for data, config, and keys
RUN mkdir -p /var/lib/registry10x/data \
             /etc/registry10x/keys \
 && chown -R registry10x:registry10x /var/lib/registry10x /etc/registry10x

# Copy binaries from the builder stage
COPY --from=builder /build/target/release/registry10x-auth     /usr/local/bin/registry10x-auth
COPY --from=builder /build/target/release/registry10x-registry /usr/local/bin/registry10x-registry
COPY --from=builder /build/target/release/registry10x-scanner  /usr/local/bin/registry10x-scanner
COPY --from=builder /build/target/release/registry10x-controller /usr/local/bin/registry10x-controller

# Ensure binaries are executable
RUN chmod +x /usr/local/bin/registry10x-auth /usr/local/bin/registry10x-registry /usr/local/bin/registry10x-scanner \
    /usr/local/bin/registry10x-controller

# Build metadata surfaced in the dashboard footer, read at runtime. Setting
# these in the runtime stage (not the builder) keeps the compile cache intact
# across commits — only these tiny final layers rebuild when the values change.
ARG REGISTRY10X_VERSION=dev
ARG REGISTRY10X_BUILD_HASH=dev
ARG REGISTRY10X_BUILD_TIME=
ENV REGISTRY10X_VERSION=${REGISTRY10X_VERSION} \
    REGISTRY10X_BUILD_HASH=${REGISTRY10X_BUILD_HASH} \
    REGISTRY10X_BUILD_TIME=${REGISTRY10X_BUILD_TIME}

# Switch to non-root user
USER registry10x

# Expose ports:
#   5000 - OCI Registry API (Docker Registry HTTP API V2)
#   5001 - Auth / Token service
#   9090 - Prometheus metrics
EXPOSE 5000 5001 9090

# Health check: probe the registry health endpoint every 30 seconds
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["/usr/local/bin/registry10x-registry", "--health-check"] || exit 1

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["tini", "--"]

# Default: run the registry service. Override with registry10x-auth to run auth.
CMD ["registry10x-registry"]
