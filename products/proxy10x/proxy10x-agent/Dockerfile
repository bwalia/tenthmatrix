# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /workspace

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY cmd/ cmd/
COPY internal/ internal/
COPY pkg/ pkg/

# Build binaries
ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_DATE=unknown
ARG TARGETARCH

RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH:-amd64} go build \
    -ldflags="-w -s \
        -X github.com/proxy10x/proxy10x/proxy10x-agent/pkg/version.Version=${VERSION} \
        -X github.com/proxy10x/proxy10x/proxy10x-agent/pkg/version.Commit=${COMMIT} \
        -X github.com/proxy10x/proxy10x/proxy10x-agent/pkg/version.BuildDate=${BUILD_DATE}" \
    -o proxy10x-agent \
    ./cmd/proxy10x-agent/main.go

RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH:-amd64} go build \
    -ldflags="-w -s \
        -X github.com/proxy10x/proxy10x/proxy10x-agent/pkg/version.Version=${VERSION} \
        -X github.com/proxy10x/proxy10x/proxy10x-agent/pkg/version.Commit=${COMMIT} \
        -X github.com/proxy10x/proxy10x/proxy10x-agent/pkg/version.BuildDate=${BUILD_DATE}" \
    -o p10xctl \
    ./cmd/p10xctl/main.go

# Runtime stage
FROM gcr.io/distroless/static:nonroot

LABEL org.opencontainers.image.title="Proxy10x Agent" \
      org.opencontainers.image.description="HA cluster agent for Proxy10x" \
      org.opencontainers.image.vendor="Proxy10x" \
      org.opencontainers.image.source="https://github.com/proxy10x/proxy10x"

WORKDIR /

COPY --from=builder /workspace/proxy10x-agent /proxy10x-agent
COPY --from=builder /workspace/p10xctl /p10xctl

USER 65534:65534

EXPOSE 9090

ENTRYPOINT ["/proxy10x-agent"]
