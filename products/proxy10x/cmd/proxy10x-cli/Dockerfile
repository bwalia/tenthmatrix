# syntax=docker/dockerfile:1
# Minimal image with proxy10x-cli + bash/jq for CI/CD pipelines.
# Build from repo root:
#   docker build -f cmd/proxy10x-cli/Dockerfile -t ghcr.io/bwalia/proxy10x-cli:latest .
#
# Run:
#   docker run --rm -e PROXY10X_BASE_URL=https://lon1.pop0.uk \
#     -e PROXY10X_TOKEN -e PROXY10X_ASSUME_YES=1 \
#     ghcr.io/bwalia/proxy10x-cli:latest check nginx

ARG GO_VERSION=1.25

FROM golang:${GO_VERSION}-alpine AS build
RUN apk add --no-cache git ca-certificates
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY cmd/proxy10x-cli ./cmd/proxy10x-cli
COPY internal ./internal

ARG VERSION=dev
ARG COMMIT=none
ARG DATE=unknown
ENV CGO_ENABLED=0
RUN go build -trimpath \
      -ldflags "-s -w -X main.version=${VERSION} -X main.commit=${COMMIT} -X main.date=${DATE}" \
      -o /out/proxy10x-cli ./cmd/proxy10x-cli

# Runtime: alpine so pipelines can use bash + jq + curl alongside the CLI.
FROM alpine:3.21

RUN apk add --no-cache \
      bash \
      ca-certificates \
      curl \
      jq \
      git \
      tzdata \
    && adduser -D -u 10001 -h /home/proxy10x proxy10x \
    && mkdir -p /home/proxy10x/.config/proxy10x /work \
    && chown -R proxy10x:proxy10x /home/proxy10x /work

COPY --from=build /out/proxy10x-cli /usr/local/bin/proxy10x-cli
COPY examples/proxy10x-cli/ /opt/proxy10x-cli/examples/

# Convenience aliases for scripts that expect `proxy10x-cli` on PATH (already set).
ENV HOME=/home/proxy10x \
    XDG_CONFIG_HOME=/home/proxy10x/.config \
    PROXY10X_CLI=/usr/local/bin/proxy10x-cli

WORKDIR /work
USER proxy10x

ENTRYPOINT ["proxy10x-cli"]
CMD ["version"]

# Override entrypoint for shell automation:
#   docker run --rm -it --entrypoint bash ghcr.io/bwalia/proxy10x-cli:latest
LABEL org.opencontainers.image.title="proxy10x-cli" \
      org.opencontainers.image.description="Proxy10x admin CLI (REST + MCP) for CI/CD" \
      org.opencontainers.image.source="https://github.com/bwalia/tenthmatrix"
