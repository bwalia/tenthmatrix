# Changelog

All notable changes to Proxy10x Ingress Controller will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Proxy10x Ingress Controller
- Zero-downtime dynamic upstream management
- Proxy10xBackend CRD for backend configuration
- Proxy10xRoute CRD for advanced routing
- Multi-architecture Docker images (amd64, arm64)
- Comprehensive Helm chart with HPA and PDB support
- Prometheus metrics integration
- Active and passive health checking
- Circuit breaking support
- Multiple load balancing algorithms (round-robin, weighted, IP hash)
- HTTP API for controller integration
- Production-ready security (non-root, read-only FS)

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [1.0.0] - TBD

### Added
- First stable release
- Complete CRD implementation (Proxy10xBackend, Proxy10xRoute)
- Go controller with Kubernetes integration
- Lua-based dynamic upstream management
- OpenResty with HTTP API endpoints
- Production-grade Helm chart
- Multi-arch Docker builds
- CI/CD pipeline with GitHub Actions
- Comprehensive documentation

[Unreleased]: https://github.com/proxy10x/proxy10x/compare/ingress-v1.0.0...HEAD
[1.0.0]: https://github.com/proxy10x/proxy10x/releases/tag/ingress-v1.0.0
