# vault10x-cli

Production-ready CLI for the [Vault10x](https://github.com/bwalia/tenthmatrix) secrets management platform.

## Installation

```bash
# From source
cargo install --path .

# Or build locally
cargo build --release
```

## Configuration

Create `~/.vault10x/config.toml`:

```toml
endpoint = "https://vault.example.com"
token = "s.my-vault-token"
tenant_id = "my-tenant"

[profiles.dev]
endpoint = "http://localhost:8443"

[profiles.prod]
endpoint = "https://vault.prod.example.com"
```

Or use environment variables:

```bash
export VAULT10X_ADDR="https://vault.example.com"
export VAULT10X_TOKEN="s.my-token"
export VAULT10X_TENANT_ID="my-tenant"
```

### Token and tenant

The tenant a command reads and writes is taken from the token itself (its
`tenant_id` claim), so use a token issued for the tenant you want.
`--tenant-id` / `VAULT10X_TENANT_ID` are only honoured when the server runs
with `VAULT_TRUST_GATEWAY_HEADERS` enabled, which is off by default.

Save a token after `vault10x init` (or let `init` prompt for one):

```bash
# Verifies the token, then saves it with its endpoint and tenant to ~/.vault10x/config.toml.
# Omit the token to be prompted for it, keeping it out of shell history.
vault10x --addr https://vault.workstation.co.uk identity login

# One profile per tenant, selected with --profile or VAULT10X_PROFILE
vault10x --addr https://vault.workstation.co.uk --profile acme identity login
vault10x --profile acme secret put app/db --data password=s3cret
```

Use the API host (`vault.…`), not the web console host (`vault-ui.…`).

## Usage

### Secrets

```bash
# Write a secret
vault10x secret put prod/database/creds --data username=admin --data password=s3cret

# Read a secret
vault10x secret get prod/database/creds

# Read a single field (for piping)
vault10x secret get prod/database/creds --field password | pbcopy

# List secrets
vault10x secret list prod/

# Delete a version
vault10x secret delete prod/database/creds --versions 1 2

# Output as JSON
vault10x --format json secret get prod/database/creds
```

### Transit Encryption

```bash
# Create a transit key
vault10x transit create-key my-app-key

# Encrypt data
vault10x transit encrypt my-app-key "sensitive data"

# Decrypt data
vault10x transit decrypt my-app-key "vault:v1:..."

# Rotate key
vault10x transit rotate-key my-app-key
```

### MCP (AI Agent Integration)

```bash
# List available MCP tools
vault10x mcp list-tools

# Read a secret via MCP protocol
vault10x mcp get-secret prod/database/password

# Encrypt via MCP
vault10x mcp encrypt my-key "plaintext"

# Call any MCP tool directly
vault10x mcp call read_secret --args '{"path":"prod/db","tenant_id":"t1"}'
```

### Identity & Leases

```bash
# Create a service account
vault10x identity create-service-account my-app --policies read-only admin

# List leases
vault10x lease list

# Renew a lease
vault10x lease renew <lease-id> --increment 7200

# Check server status
vault10x status
```

### Profiles

```bash
# Use a specific profile
vault10x --profile prod secret get prod/database/creds

# Override endpoint on the fly
vault10x --addr https://other-vault.com secret list
```

### Shell Completions

```bash
# Bash
vault10x completion bash >> ~/.bashrc

# Zsh
vault10x completion zsh >> ~/.zshrc

# Fish
vault10x completion fish > ~/.config/fish/completions/vault10x.fish

# PowerShell
vault10x completion powershell >> $PROFILE
```

## Security

- Secrets are held in memory using `zeroize` — automatically wiped on drop
- Authentication tokens are never logged (hidden from `--help` and tracing)
- TLS certificate validation is enforced by default
- Destructive operations (destroy) show warnings before proceeding

## License

Apache-2.0
