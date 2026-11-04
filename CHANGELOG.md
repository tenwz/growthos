# Changelog

All notable changes to growthOS. The file format is versioned separately in the spec; see `spec/growth-repo-spec-v0.1.md`.

## [0.1.0] — 2026-11-05

First public release. Pre-launch; no users yet, and `PROOF.md` records that honestly.

### Added

- **Growth Repo Spec v0.1** — normative folder layout, signals, memos, experiments, jobs, config, and conformance rules.
- **`growthos` CLI**
  - `init`, `demo`, `doctor`, `capture`, `status`
  - `task list|compile|run` with `command` and `openai-compatible` providers
  - `experiment new|list|log|decide`
  - `score`, `cockpit`, `mcp`
  - Exit codes for CI: `1` evidence failure, `2` usage, `3` provider, `4` score below `--min`.
- **Evidence engine** — citation resolution, SHA-256 quote hashes over normalized quote + canonical URL + published date, retraction and supersession checks, synthetic-provenance rules, and receipt-table consistency. No LLM in the audit path.
- **Deterministic Growth OS Score** — 100 points across evidence (30), freshness (15), loop closure (20), agent operations (15), memo quality (10), and proof/cockpit (10). Under 20 signals caps at 60; synthetic signals cannot certify.
- **Self-contained cockpit** — one HTML file with inline SVG charts, no CDN, no fonts, no network requests. Also emits `badge.json`, `badge.svg`, and `share-card.svg`.
- **MCP server** — read tools for status, signals, memos, audits, score, and experiments; write tools default to dry-run and require approval. Resources for the spec and signals; a weekly customer-truth prompt.
- **Agent skills** — one router skill and six system skills with explicit hard rules: no invented quotes, every claim cites, human approval before publishing, no scraping, no auto-send.
- **Examples** — a synthetic HVAC SaaS repo with 31 signals, a passing memo (6 claims, 18 receipts), an intentionally failing memo, and a closed experiment ledger.
- **Dogfood** — growthOS runs its own `growth/` repo with 20 real public signals, a 6-claim memo, two proposed experiments, and an honest week-0 `PROOF.md`. Current score: 82/100 (System).
- **Distribution** — GitHub Action, CI on Node 20/22 and Windows, npm pack smoke test, JSON Schemas, landing page, and the `launch/` kit.

### Known limitations

- Three of the six systems (founder content, outbound, AI search) ship as job specs, not dedicated software.
- The evidence engine checks provenance and integrity, not relevance. A real quote can still be cited for a claim it does not support.
- Freshness and loop-closure points reward activity as well as quality; the score is a floor, not a certificate of truth.
- The dogfood sample is 20 Hacker News and GitHub signals, not a representative customer base.
