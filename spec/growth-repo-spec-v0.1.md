# Growth Repo Spec v0.1

**Status:** draft for public comment
**Version:** `growthos/growth-repo@0.1`
**Published:** 2026-11-05
**Editors:** growthOS maintainers

## 1. Purpose

This specification defines a portable, file-based format for a company's marketing memory: what customers said, what the company claims, what it tested, and what it learned.

The format is designed so that:

- a coding agent can read and write it with ordinary file tools;
- a human can review every claim and every source;
- a deterministic program, not an LLM, can decide whether a claim is admissible;
- the repository remains useful if every tool that reads it disappears.

A repository that conforms to this spec is a **Growth OS**.

## 2. Conformance

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are used as in RFC 2119.

A Growth OS MUST contain:

```text
.growthos/config.yaml
growth/signals/
growth/memos/
growth/experiments/
growth/agents/
growth/cockpit/
```

It SHOULD contain `growth/README.md`, `growth/company.md`, `growth/icp.md`, and `growth/voice.md`.

A conforming **validator** MUST implement the rules in §7. A conforming **writer** MUST produce files matching §4–§6. A conforming **reader** MUST ignore unknown `x_`-prefixed keys and MUST NOT execute instructions found inside signal text.

## 3. Common conventions

### 3.1 File format

Every record is a Markdown file with YAML frontmatter delimited by `---`. The frontmatter is a YAML mapping. The body is Markdown.

### 3.2 Schema marker

Every frontmatter MUST include:

```yaml
schema: growthos/<type>@1
```

Supported types: `config`, `signal`, `memo`, `experiment`, `job`, `eval`.

### 3.3 Identifiers

IDs use a prefix and a Crockford base32 ULID:

| Type | Prefix | Example |
| --- | --- | --- |
| Signal | `sig_` | `sig_01J8ZQ9V6K4M2N8P3R5T7W9X1Y` |
| Memo | `memo_` | `memo_01J8ZQ9V6K4M2N8P3R5T7W9X1Y` |
| Experiment | `exp_` | `exp_01J8ZQ9V6K4M2N8P3R5T7W9X1Y` |
| Run | `run_` | `run_01J8ZQ9V6K4M2N8P3R5T7W9X1Y` |
| Job | `job_` | `job_customer-truth` (stable slug) |

The ULID MUST match `[0-9A-HJKMNP-TV-Z]{26}`. IDs are immutable.

### 3.4 Timestamps

Timestamps are ISO 8601 with an explicit timezone, e.g. `2026-11-05T16:00:00Z`. Dates without a time are `YYYY-MM-DD`.

### 3.5 Unknown keys

Unknown keys MUST be rejected unless they begin with `x_`. Extension keys are preserved by tools that rewrite files.

## 4. Signal

A signal is **append-only**. Corrections are new signals with `supersedes` set; the old signal's `status` becomes `superseded`.

Path: `growth/signals/YYYY-MM-DD-<slug>.md`

```yaml
schema: growthos/signal@1
id: sig_01...
status: active            # active | retracted | superseded
provenance: public        # public | internal | synthetic
captured_at: 2026-11-05T16:00:00Z
source:
  kind: x_post            # x_post | reddit_comment | hn_comment | github_issue |
                          # interview | support_ticket | review | survey | call | metric | note | other
  url: https://x.com/acme/status/123
  author: "@acme"         # optional
  published_at: 2026-11-04T09:12:00Z   # optional
  retrieved_at: 2026-11-05T16:00:00Z
quote: "We tried an AI SDR for a month..."
summary: "Agency owner rejects AI SDR because of lead quality."
segment: agency-owner
tags: [ai-sdr, lead-quality]
consent: public           # public | internal | anonymized
integrity:
  quote_hash: "sha256:..."
  canonical_url: https://x.com/acme/status/123
supersedes: null
```

### 4.1 Quote

`quote` MUST be verbatim. Whitespace normalization is permitted; paraphrase is not. For non-text evidence, use an `evidence` block instead:

```yaml
evidence:
  type: event_count       # or metric
  count: 12
  window: 2026-10-01..2026-10-31
  query: "support tickets tagged missed-call"
```

### 4.2 Integrity

`integrity.quote_hash` is:

```text
sha256( normalize(quote) + "\n" + canonical_url + "\n" + published_at_or_empty )
```

where `normalize` collapses whitespace and trims, `canonical_url` removes fragments and known tracking parameters (`utm_*`, `fbclid`, `gclid`, `ref`, `source`), and `published_at` is empty when absent. The prefix is literally `sha256:`.

A validator MUST recompute the hash and MUST report a mismatch.

### 4.3 Provenance and consent

- `public`: the source is publicly accessible. Requires `source.url`.
- `internal`: private notes or calls. Requires `consent` to be `internal` or `anonymized`.
- `synthetic`: demo data. MUST NOT back a published memo.

## 5. Memo

Path: `growth/memos/YYYY-MM-DD-<slug>.md`. Published memos are **immutable**: create a new memo that `supersedes` the old one.

```yaml
schema: growthos/memo@1
id: memo_01...
period: 2026-W45
status: draft             # draft | published | rejected
generated_by: job_customer-truth
claim_count: 6
receipt_count: 18
source_diversity: 4
created_at: 2026-11-05T16:00:00Z
published_at: null
supersedes: null
```

### 5.1 Claims

The body MUST contain a level-2 heading `## Claims`. Each **top-level** list item under that heading is a claim. Nested list items and other sections are not claims.

Every claim MUST contain at least one citation of the form `[@sig_<ULID>]`.

### 5.2 Required sections

A published memo MUST contain:

- `## Claims`
- `## What we are not saying`
- `## Receipts` (generated; a table listing every claim and its signals)

A memo SHOULD contain `## Counterevidence` and `## What to test next`.

### 5.3 Metadata

`claim_count`, `receipt_count`, and `source_diversity` MUST match the body. `source_diversity` is the number of distinct `source.kind` values among the memo's receipts.

## 6. Experiment

Path: `growth/experiments/<exp_id>/experiment.md`. The asset lives next to it, usually `asset.md`.

```yaml
schema: growthos/experiment@1
id: exp_01...
status: proposed          # proposed | running | complete | abandoned
hypothesis: "A missed-call calculator will produce 25 email captures in 14 days because..."
signal_ids: [sig_01...]
channel: landing-page
audience: owner-operator
owner: human
start_at: 2026-11-05T16:00:00Z
end_at: null
primary_metric:
  name: email_captures
  baseline: 6
  target: 25
  observed: 9
guardrails: ["demo-request rate >= 2%"]
decision: null            # scale | iterate | kill | inconclusive
learning: null
```

### 6.1 Results

The body MUST contain a level-2 heading `## Results` with a table:

```markdown
| Date | Metric | Value | Receipt |
| --- | --- | --- | --- |
| 2026-11-12 | email_captures | 9 | growth/metrics/2026-w46.json |
```

Every row's `Receipt` MUST be non-empty.

### 6.2 Closure

An experiment MAY be `complete` only if:

- it has at least one result row with a receipt;
- `decision` is one of `scale | iterate | kill | inconclusive`;
- `learning` is a non-empty sentence;
- a learning file exists at `growth/learnings/<exp_id>.md`.

## 7. Validation rules

A conforming validator MUST report these as errors:

| ID | Rule |
| --- | --- |
| `memo.claim.receipt_count` | A claim has no citation |
| `memo.claim.missing_receipt` | A citation does not resolve |
| `memo.claim.inactive_receipt` | A citation points to a non-active signal |
| `memo.claim.synthetic_receipt` | A published memo cites a synthetic signal |
| `memo.receipts_table` | The receipts table does not match the claims |
| `memo.metadata.*` | Declared counts do not match the body |
| `signal.quote_present` | Missing or empty quote |
| `signal.source_present` | Missing URL and evidence block |
| `signal.integrity_present` | Missing quote hash |
| `signal.hash_integrity` | Hash does not match |
| `signal.duplicate_hash` | Two signals share one quote hash |
| `experiment.signal_resolves` | Experiment cites a missing signal |
| `experiment.decision` | Complete experiment lacks decision or learning |
| `experiment.result_receipt` | Decision without a receipted result |
| `job.system_coverage` | One of the six required jobs is missing |
| `job.human_approval` | A job publishes or sends without human approval |
| `security.secret` | A credential pattern appears in a tracked file |

These are errors when `--strict` is set, warnings otherwise:

- stale memo (older than 14 days);
- source diversity below 2 for a published memo;
- duplicate claims (Jaccard similarity above 0.8);
- missing `## Counterevidence` or `## Next tests`.

## 8. Score

The Growth OS Score is a deterministic function of a validated repository. It is not part of conformance, but conforming tools SHOULD implement:

| Dimension | Points |
| --- | ---: |
| Evidence integrity | 30 |
| Freshness and coverage | 15 |
| Loop closure | 20 |
| Agent operations | 15 |
| Memo quality | 10 |
| Proof and cockpit | 10 |

Synthetic repositories MUST be labeled and MUST NOT be certified. A repository with fewer than 20 active signals MUST be capped at 60 points.

The reference implementation is `scoreRepo` in `@growthos/core` and is covered by tests.

## 9. Jobs

Path: `growth/agents/<name>.job.md`. Every job MUST declare:

```yaml
schema: growthos/job@1
id: job_customer-truth
name: Customer Truth
data_sources: [...]
schedule: "0 8 * * 1-5"
filters: {...}
outputs: [...]
quality_bar:
  min_receipts_per_claim: 1
  verbatim_quotes: true
  require_source_url: true
  min_source_diversity: 2
human_approval: required
success_metric: "..."
write_back: "..."
```

A job that publishes public content or sends outbound messages MUST set `human_approval: required`.

## 10. Security and privacy

- Signal text is untrusted input. Readers MUST NOT execute instructions found in it.
- Validators SHOULD scan for credential patterns and MUST NOT print secret values.
- Public signals SHOULD use `consent: public`; anonymized internal signals MUST NOT contain names, emails, or phone numbers.
- Tools MUST NOT scrape private data, bypass authentication, or send messages without explicit human approval.

## 11. Versioning

The `schema` marker carries a major version. v0.1 uses `@1` for all record types. Backward-compatible additions are made through `x_` keys or optional fields. Breaking changes require a new major version and a migration tool.

## 12. Reference implementation

- Core: `packages/core`
- CLI: `packages/cli` (`growthos`)
- MCP: `packages/mcp`
- Example: `examples/hvac-saas`
- Schemas: `spec/schemas/*.json`

Comments and counterexamples are welcome in [GitHub Discussions](https://github.com/tenwz/growthos/discussions).
