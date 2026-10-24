# Registry10x Architecture

A single mapped diagram of the enterprise feature set.

![Registry10x Enterprise Architecture](./registry10x-enterprise.svg)

## Reading guide

The diagram has four lanes:

| Lane               | Contents                                                                            |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Clients & ingress** | CI/CD, engineers, k8s pod pulls, the Ingress + TLS cert-manager, plus three external dependencies (upstream registries, source registries, LLM provider) and the operator entrypoints (Web UI, Grafana). |
| **Data plane**     | The synchronous registry path: `registry10x-auth`, `registry10x-registry`, the `registry10x-mirror` pull-through cache, multi-region `registry10x-replication`, the P2P `registry10x-peer` mesh, the `registry10x-import` migration runner, and the object store. |
| **Async pipelines** | Every fire-and-forget worker: `registry10x-scanner` (CVE / license / secret / malware), the GC reaper + reconciler (009), the TTL reaper (013), the lazy-pull indexer (010), lineage capture + rebuild emitters (018), the usage drainer + rollups (017), and the DSSE attestation verifier (015). |
| **State · obs · AI** | Postgres tables that back every persistent feature, Redis for ephemeral scan results, Prometheus, the AI agent (`registry10x-pilot`, 019), the LLM provider, and the hash-chained audit log (005). |

## Arrow legend

- **Solid blue** — synchronous request path. Client waits.
- **Dashed amber** — fire-and-forget enqueue. The hot path returns immediately and the work happens later.
- **Dotted green** — read-only telemetry. Prometheus scraping `/metrics`, Grafana querying Postgres / Prometheus for dashboards.

## Where each feature lives

| Slice / feature              | Component on the diagram                  |
| ---------------------------- | ----------------------------------------- |
| 005 audit log                | State · obs · AI lane (bottom)            |
| 009 online GC                | registry10x-registry (refcount writer) + GC reaper + Postgres tables |
| 010 lazy pull                | Lazy indexer (async) + registry10x-registry referrers route |
| 011 P2P pull mesh            | registry10x-peer in the data-plane lane        |
| 012 migration importer       | registry10x-import in the data-plane lane      |
| 013 ephemeral repos / TTL    | registry10x-registry TTL header + TTL reaper   |
| 014 extended scanning        | registry10x-scanner box (cve/license/secret/malware pills) |
| 015 SLSA attestations        | Attestation verifier in async pipelines + registry10x-registry attestation upload route |
| 016 typed artifacts          | registry10x-registry "art-types" pill          |
| 017 cost telemetry           | registry10x-registry "usage" pill + usage drainer + Grafana panels |
| 018 auto-rebuild             | Lineage + rebuild box                     |
| 019 AI agent                 | registry10x-pilot in the AI lane               |

## Editing

The SVG is hand-authored — `docs/architecture/registry10x-enterprise.svg`. To
change a label, fix a flow, or add a feature, edit the SVG directly and run:

```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('docs/architecture/registry10x-enterprise.svg')"
```

to lint. GitHub renders SVG inline so the README above will pick up changes automatically.
