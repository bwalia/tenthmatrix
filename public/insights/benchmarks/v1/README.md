# Workstation AI Insights — Benchmark reproducibility pack (v1 methodology)

**Lab version:** `lab-v0.1`  
**Date:** 26 September 2026  
**Status:** Methodology + cited external results. Live `workstation_measured` runs will be published as immutable `v1`, `v2`, `v3` artefacts without overwriting history.

## What this pack is

Schemas, suite definitions and citation notes for the Jev Benchmark Lab on [workstation.co.uk/insights/jev/benchmarks](https://www.workstation.co.uk/en/insights/jev/benchmarks).

## What this pack is not

- Not a claim that Workstation has reproduced TypeSafe’s homepage 193.6× / 444.6× workflow multipliers.
- Not a licence to republish third-party videos, figures or full datasets without their terms.
- Not production safety certification.

## Source kinds

| Kind | Meaning |
| --- | --- |
| `vendor_reported` | Numbers or qualitative claims from TypeSafe (or closely partnered posts), attributed |
| `independent` | Third-party published measurements (OpenRouter, AyAutomate, LangChain LangSmith, JevBench, etc.) |
| `workstation_methodology` | Demo/illustrative rows for UI and harness design |
| `workstation_measured` | (Future) Workstation-run results with raw JSONL |

## Required result fields

See `schema-result.json`. Latency must state whether network time is included and from which region.

## Suites planned

- A Intent routing
- B Model routing
- C Tool safety
- D Failure detection
- E RAG evaluation
- F Support automation
- G Coding-agent orchestration gates
- H High-cardinality routing

## Primary citations

1. https://typesafe.ai/blog/introducing-system-one-models-and-jev
2. https://www.langchain.com/blog/building-a-harness-with-jev
3. https://docs.typesafe.ai/llms.txt
4. https://www.langchain.com/blog/jev-agent-evals-langsmith
5. https://openrouter.ai/blog/tutorials/jev-vs-llm-when-to-use-each/
6. https://www.ayautomate.com/blog/jev-vs-llm-benchmark
7. https://github.com/fstandhartinger/jevbench

## Avoiding benchmark theatre

- No composite score without published weights.
- No mixing model versions silently.
- No comparing local mocks to remote APIs without labels.
- Always answer: what was measured, and what this does **not** prove.
