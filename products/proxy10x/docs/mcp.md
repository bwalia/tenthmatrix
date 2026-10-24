# MCP (Model Context Protocol) Server Support for Proxy10x

## Overview

Proxy10x includes a built-in **MCP (Model Context Protocol) server** that allows AI agents to securely discover, read, and interact with the gateway's configuration, routing rules, health status, and traffic metrics.

MCP is an open standard that enables AI assistants (Claude, GPT, Cursor, custom agents) to programmatically access structured data from external systems. Proxy10x's MCP implementation follows a **read-first, safe-by-default** design philosophy.

## Why MCP Support?

- **AI-Native Operations**: Enable AI agents to understand your proxy configuration, diagnose issues, and suggest optimizations
- **Structured Discovery**: Agents can discover available data through standardized endpoints rather than parsing documentation
- **Typed Resources**: Every resource has an explicit schema (`proxy10x.server`, `proxy10x.rule`, etc.) with strong typing
- **Enterprise Security**: Token-based auth, read-only mode by default, automatic secret redaction
- **Observability Integration**: Expose traffic metrics, error rates, and health status to AI monitoring agents

## Architecture

```
AI Agent (Claude/GPT/Cursor)
       │
       ▼
  /mcp/* endpoints (NGINX location block)
       │
       ▼
  mcp/handler.lua (Router)
       │
       ├── mcp/auth.lua (API key validation)
       ├── mcp/config.lua (Configuration loader)
       ├── mcp/resources.lua (Data providers)
       ├── mcp/tools.lua (Feature-flagged actions)
       ├── mcp/schemas/ (Typed JSON schemas)
       │     ├── manifest.lua
       │     ├── capabilities.lua
       │     ├── resource.lua (per-domain schemas)
       │     ├── tool.lua
       │     └── error.lua
       └── mcp/mappers/ (Swagger → MCP resource mappers)
             ├── server.lua   (Swagger /api/servers → proxy10x.server)
             ├── rule.lua     (Swagger /api/rules → proxy10x.rule)
             ├── upstream.lua (Internal → proxy10x.upstream)
             ├── profile.lua  (Swagger /api/profiles → proxy10x.profile)
             ├── ssl.lua      (Internal → proxy10x.ssl)
             ├── cache.lua    (Swagger /api/cache → proxy10x.cache)
             ├── health.lua   (Internal → proxy10x.health)
             ├── metrics.lua  (Internal → proxy10x.metrics)
             └── settings.lua (Internal → proxy10x.settings)
```

All MCP code lives in `api/mcp/` and integrates with existing Proxy10x modules without duplicating business logic.

## Endpoints

### Core MCP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp/manifest` | GET | MCP server manifest (discovery) |
| `/mcp/capabilities` | GET | Detailed capability listing with typed resources |
| `/mcp/resources` | GET | List all available resources |
| `/mcp/resources/{id}` | GET | Fetch a typed resource by ID |
| `/mcp/tools` | GET | List available tools |
| `/mcp/tools/{name}` | POST | Execute a tool |
| `/mcp/schemas` | GET | List all typed MCP schemas |
| `/mcp/schemas/{name}` | GET | Get a specific schema definition |
| `/mcp/jsonrpc` | POST | Full JSON-RPC 2.0 endpoint |

### Available Resources (Typed)

| Resource ID | MCP Type | Swagger Source | Category |
|-------------|----------|----------------|----------|
| `servers` | `proxy10x.server` | `GET /api/servers` | Configuration |
| `rules` | `proxy10x.rule` | `GET /api/rules` | Configuration |
| `upstreams` | `proxy10x.upstream` | Internal | Configuration |
| `profiles` | `proxy10x.profile` | `GET /api/profiles` | Configuration |
| `ssl` | `proxy10x.ssl` | Internal | Security |
| `cache` | `proxy10x.cache` | `GET /api/cache/configs` | Performance |
| `health` | `proxy10x.health` | `GET /api/openresty_status` | Observability |
| `metrics` | `proxy10x.metrics` | Internal | Observability |
| `settings` | `proxy10x.settings` | Internal | Configuration |

### Typed Resource Envelope

All resources are returned with typed envelopes:

```json
{
  "type": "proxy10x.server",
  "id": "srv-abc-123",
  "attributes": {
    "server_name": "api.example.com",
    "profile_id": "prod",
    "ssl_enabled": true,
    "config_status": true
  },
  "relationships": {
    "profile": {
      "type": "proxy10x.profile",
      "id": "prod"
    },
    "rules": {
      "type": "proxy10x.rule",
      "id": "rule-uuid"
    }
  }
}
```

### Available Tools (Feature-Flagged)

| Tool Name | Description | Read-Only Safe |
|-----------|-------------|----------------|
| `validate_config` | Run `openresty -t` syntax check | Yes |
| `get_error_logs` | Fetch recent error logs (redacted) | Yes |
| `reload_config` | Reload NGINX config (dry-run first) | No (requires read-write mode) |

## Swagger → MCP Resource Mapping

The MCP server maps existing Swagger API domain objects to typed MCP resources:

| Swagger Endpoint | MCP Resource Type | Mapping |
|-----------------|-------------------|---------|
| `GET /api/servers` | `proxy10x.server.list` | Server configs → typed server resources |
| `GET /api/servers/{id}` | `proxy10x.server` | Single server with relationships |
| `GET /api/rules` | `proxy10x.rule.list` | Security rules → typed rule resources |
| `GET /api/rules/{id}` | `proxy10x.rule` | Single rule with match/response details |
| `GET /api/profiles` | `proxy10x.profile.list` | Profiles with server counts |
| `GET /api/cache/configs` | `proxy10x.cache.list` | Cache configs per server |
| `GET /api/openresty_status` | `proxy10x.health` | Health + worker info |

**Mapping Rules:**
- One Swagger domain object → one MCP resource type
- No invented business concepts
- Relationships link resources (server ↔ rule, server ↔ SSL)
- Sensitive fields are automatically redacted

## MCP Schemas

All schemas are defined in `api/mcp/schemas/` and accessible via `/mcp/schemas`:

### Core Protocol Schemas

| Schema | Description |
|--------|-------------|
| `manifest` | MCP server manifest (JSON-RPC 2.0 envelope) |
| `capabilities` | Server capabilities with resource/tool declarations |
| `resource` | Resource response envelope |
| `resource_list` | Resource list response |
| `tool` | Tool definition with input schema and annotations |
| `tool_result` | Tool execution result envelope |
| `error` | Standardized error response |

### Domain Resource Schemas

| Schema | Type | Fields |
|--------|------|--------|
| `server` | `proxy10x.server` | id, server_name, profile_id, listens, ssl_enabled, config_status |
| `rule` | `proxy10x.rule` | id, name, priority, match, response |
| `upstream` | `proxy10x.upstream` | id, name, servers, algorithm, health_check |
| `profile` | `proxy10x.profile` | id, name, server_count |
| `ssl` | `proxy10x.ssl` | domain, ssl_enabled, ssl_auto_renew, ssl_force_https |
| `cache` | `proxy10x.cache` | server_name, cache_enabled, cache_ttl, cached_extensions |
| `health` | `proxy10x.health` | status, openresty, mcp, shared_dicts |
| `metrics` | `proxy10x.metrics` | traffic, connections, latency, request_methods |
| `settings` | `proxy10x.settings` | storage_type, ssl_staging, dns_resolver, mcp |

## Configuration

### settings.json

Add an `mcp` section to your `settings.json`:

```json
{
  "mcp": {
    "enabled": true,
    "mode": "read-only",
    "tools_enabled": false,
    "api_key": "your-secure-api-key-here",
    "api_key_header": "X-MCP-API-Key",
    "rate_limit": 100,
    "redact_secrets": true
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable MCP server |
| `mode` | string | `"read-only"` | `"read-only"` or `"read-write"` |
| `tools_enabled` | boolean | `false` | Enable MCP tools |
| `api_key` | string | `null` | API key for authentication |
| `api_key_header` | string | `"X-MCP-API-Key"` | Header name for API key |
| `rate_limit` | number | `100` | Max requests per minute |
| `redact_secrets` | boolean | `true` | Auto-redact sensitive fields |

### Environment Variable Overrides

Environment variables take highest priority:

```bash
MCP_ENABLED=true          # Enable MCP server
MCP_MODE=read-only        # Set operation mode
MCP_API_KEY=my-secret-key # Set API key
MCP_TOOLS_ENABLED=false   # Enable/disable tools
```

## Security Model

### Authentication

MCP endpoints support three authentication methods (checked in order):

1. **Custom Header**: `X-MCP-API-Key: your-api-key`
2. **Bearer Token**: `Authorization: Bearer your-api-key`
3. **Query Parameter**: `?api_key=your-api-key` (development only)

If no API key is configured, MCP runs in open mode (suitable for development). **Always set an API key in production.**

### Read-Only Mode (Default)

By default, MCP operates in `read-only` mode:
- All resource reads are permitted
- Tool execution (write operations) is blocked
- Config reload requires explicit `read-write` mode

### Secret Redaction

All responses automatically redact sensitive fields:
- Passwords, API keys, tokens, secrets
- JWT passphrases
- AWS credentials
- SSL private keys

Redacted fields appear as `"[REDACTED]"` in responses.

### Network Restrictions

MCP endpoints are served on the admin port (8080) alongside the existing management API. They are **not** exposed on the public-facing proxy ports (80/443).

## Usage Examples

### curl Examples

**Get the MCP manifest:**

```bash
curl -H "X-MCP-API-Key: your-key" \
  https://your-proxy10x:8080/mcp/manifest
```

**List all resources:**

```bash
curl -H "X-MCP-API-Key: your-key" \
  https://your-proxy10x:8080/mcp/resources
```

**Read typed server resources:**

```bash
curl -H "X-MCP-API-Key: your-key" \
  https://your-proxy10x:8080/mcp/resources/servers?profile_id=prod
```

**List available schemas:**

```bash
curl -H "X-MCP-API-Key: your-key" \
  https://your-proxy10x:8080/mcp/schemas
```

**Get a specific schema:**

```bash
curl -H "X-MCP-API-Key: your-key" \
  https://your-proxy10x:8080/mcp/schemas/servers
```

**JSON-RPC endpoint:**

```bash
curl -X POST \
  -H "X-MCP-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"resources/read","params":{"uri":"proxy10x://resources/health"}}' \
  https://your-proxy10x:8080/mcp/jsonrpc
```

### Claude Desktop / MCP Client Configuration

Add Proxy10x as an MCP server in your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "proxy10x": {
      "url": "https://your-proxy10x:8080/mcp/jsonrpc",
      "headers": {
        "X-MCP-API-Key": "your-api-key"
      }
    }
  }
}
```

### Cursor IDE MCP Configuration

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "proxy10x": {
      "url": "https://your-proxy10x:8080/mcp/jsonrpc",
      "headers": {
        "X-MCP-API-Key": "your-api-key"
      }
    }
  }
}
```

### Example Agent Queries

Once connected, AI agents can ask questions like:

- "What servers are configured in the prod profile?"
- "Show me the current health status of the gateway"
- "What are the top error codes in the last 24 hours?"
- "List all SSL-enabled domains"
- "What security rules are applied to incoming requests?"
- "Check if the NGINX configuration is valid"
- "Show me the typed schema for server resources"
- "What relationships exist between servers and rules?"

## AI Agent Compatibility

The MCP implementation is compatible with:

| Client | Transport | Status |
|--------|-----------|--------|
| Claude MCP Client | JSON-RPC over HTTP | Supported |
| OpenAI Agents (GPT) | REST API | Supported |
| Cursor IDE | JSON-RPC over HTTP | Supported |
| Custom Agents | REST or JSON-RPC | Supported |

### Response Design Principles

All MCP responses follow these principles for optimal AI agent consumption:

1. **Typed Resources**: Every resource has an explicit `type` field (e.g., `proxy10x.server`)
2. **Deterministic**: Same input always produces same output structure
3. **Explicit Schemas**: Every response uses well-defined JSON schemas accessible via `/mcp/schemas`
4. **Structured Data Only**: No free-form text where structured data is expected
5. **Relationship-Aware**: Resources include typed references to related resources
6. **Self-Describing**: Resources include URIs, MIME types, and metadata
7. **Safe by Default**: Secrets redacted, read-only mode, rate-limited

## Agent Examples

Working agent examples are available in `examples/agents/`:

- **`claude-agent.md`**: Full Claude Desktop integration with discovery flow, resource reading, and prompt examples
- **`gpt-agent.md`**: OpenAI function calling setup, Python implementation, and multi-resource analysis

## Write-Enabled Roadmap

See `docs/mcp-write-roadmap.md` for the phased plan to enable write operations:

1. **Phase 1** (Current): Read-only
2. **Phase 2**: Dry-run tools
3. **Phase 3**: Human-approved writes
4. **Phase 4**: Policy-controlled autonomous writes

## Operational Considerations

### Performance

- MCP endpoints add no overhead to normal proxy traffic (separate location block)
- Resource reads are backed by file I/O (same as admin API)
- Shared dictionary queries are non-blocking
- No database connections required

### Monitoring

- MCP requests are logged in the NGINX access log
- Failed authentication attempts are logged at `WARN` level
- Tool executions are logged at `INFO` level

### Scaling

- MCP endpoints scale with OpenResty workers
- No external dependencies (no Redis, no database for MCP itself)
- Stateless — every request is independent

## Troubleshooting

### MCP returns 503 "MCP server is not enabled"

Add `"mcp": {"enabled": true}` to your `settings.json` or set `MCP_ENABLED=true` environment variable.

### MCP returns 401 "Missing MCP API key"

Provide the API key via `X-MCP-API-Key` header or `Authorization: Bearer <key>` header.

### Tools return "MCP tools are disabled"

Set `"tools_enabled": true` in the MCP config and ensure `mode` is `"read-write"` for write operations like `reload_config`.

### Resources return empty arrays

Ensure the `NGINX_CONFIG_DIR` environment variable points to the correct data directory and that the profile directory (e.g., `data/servers/prod/`) contains JSON configuration files.

### Schemas show unexpected structure

Use `/mcp/schemas/{name}` to inspect the exact schema for any resource type. Schema version is returned in the `X-MCP-Schema-Version` response header.

## API Reference

Full API documentation is available at:
- **Swagger UI**: `https://your-proxy10x:8080/swagger/`
- **OpenAPI Spec**: `https://your-proxy10x:8080/swagger/openapi.yaml`
