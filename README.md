# growthOS

**Marketing skills teach agents what to say. growthOS gives them memory, receipts, and a scoreboard.**

[![ci](https://github.com/tenwz/growthos/actions/workflows/ci.yml/badge.svg)](https://github.com/tenwz/growthos/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/growthos?color=3ddc84)](https://www.npmjs.com/package/growthos)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-black)](package.json)
[![spec](https://img.shields.io/badge/spec-v0.1-3ddc84)](spec/growth-repo-spec-v0.1.md)

A Growth OS is a folder your coding agent can read: real customer signals, memos that cite them, experiments that end in decisions, and a weekly cockpit that scores the whole thing.

No SaaS. No database. No scrapers. Just Markdown, YAML, a CLI, and MCP.

```bash
npx growthos demo
```

```text
Auditing 2 memos...
  FAIL  growth/memos/2026-11-03-draft-missed-call-ai.md
        Claim 2: "HVAC owners want an AI SDR."
        Claim 2 has no receipt. Add [@sig_...] or remove the claim.

  PASS  growth/memos/2026-11-05-whatthemarketistellingus.md
        6 claims, 18 receipts, 4 channels.

Growth OS Score: 88/100 (System)
```

The demo is offline, deterministic, and takes about three seconds. It creates a complete synthetic company, audits it, writes a self-contained cockpit, and opens it. No API key required.

![Growth OS Score card](docs/assets/score-card.svg)

## The problem

An agent can write a hundred marketing claims in a minute. It cannot tell you which ones are true.

So teams end up with:

- a Notion doc of "insights" nobody can trace back to a customer;
- a content calendar that repeats what the founder already believed;
- experiments that end in a vibe, not a decision;
- an AI that confidently invents a quote, a number, or a competitor's weakness.

The bottleneck is not generation. It is **memory and evidence**.

## The idea

Greg Isenberg calls the new role the **marketing engineer**: someone who builds growth systems, not campaigns. A Growth OS has five folders and six systems:

```text
growth/
├── signals/       # what customers actually said, with sources
├── memos/         # claims that cite signals as [@sig_...]
├── experiments/   # hypothesis -> metric receipt -> decision -> learning
├── agents/        # job specs with quality bars and approval gates
└── cockpit/       # a static dashboard + Growth OS Score
```

| System | Status in v0.1 | What it does |
| --- | --- | --- |
| **Customer Truth** | Real software | Capture signals, compile a memo, reject claims without receipts |
| **Creative Testing** | Real software | Hypothesis → result with receipt → decision → learning |
| **Growth Cockpit** | Real software | Static evidence dashboard + shareable 100-point score |
| **Founder Content** | Complete job spec | Turns one signal into one specific post, with receipts |
| **Outbound Signal** | Complete job spec | Public signal → angle → draft; a human sends |
| **AI Search Visibility** | Complete job spec | Finds where assistants cite others instead of you |

The loop is closed:

```text
signal → claim → receipt → memo → experiment → decision → learning → next signal
```

## Quickstart

### 1. See the loop fail correctly

```bash
npx growthos demo
```

### 2. Start your own repo

```bash
npx growthos init my-growth-os --agent all
cd my-growth-os
```

This creates the five folders, six job specs, `AGENTS.md`, `CLAUDE.md`, and a Cursor rule.

### 3. Capture a real signal

A signal is one verbatim quote from one source. Public signals need a URL.

```bash
npx growthos capture \
  --source x_post \
  --url "https://x.com/acme/status/123" \
  --quote "We tried an AI SDR for a month. It booked 3 meetings and 2 were with other AI companies." \
  --summary "Agency owner rejects AI SDR because of lead quality." \
  --segment agency-owner \
  --tags ai-sdr,lead-quality \
  --provenance public
```

The CLI hashes the quote. If someone edits the quote later, `doctor` notices.

### 4. Write a memo the market can defend

```bash
npx growthos task compile job_customer-truth --since 7d
```

This writes a prompt, the selected signals (wrapped as untrusted data), and an output contract into `.growthos/runs/<run_id>/`. Paste `prompt.md` into Claude Code, Codex, Cursor, or any model. Or run it through a provider:

```bash
npx growthos task run job_customer-truth --apply
```

### 5. Let the build reject hand-waving

```bash
npx growthos doctor --strict
```

```text
growthOS doctor /path/to/repo
  FAIL  Claim 2 has no receipt. Add [@sig_...] or remove the claim.  growth/memos/2026-11-03-draft-missed-call-ai.md:7

Summary: 1 error, 2 warnings
```

Exit codes are stable: `0` clean, `1` evidence failure, `2` usage, `3` provider, `4` score below `--min`. Use it in CI.

```yaml
- uses: tenwz/growthos@v0.1
  with:
    path: .
    strict: true
    min-score: 60
```

### 6. Run one honest experiment

```bash
npx growthos experiment new \
  --hypothesis "A missed-call calculator will produce 25 email captures in 14 days because owners cannot estimate the loss themselves." \
  --channel landing-page \
  --metric email_captures \
  --signal sig_01... \
  --baseline 6 \
  --target 25 \
  --guardrail "demo-request rate >= 2%"

npx growthos experiment log exp_01... --metric email_captures --value 9 --source growth/metrics/2026-w46.json

npx growthos experiment decide exp_01... \
  --decision iterate \
  --learning "Owners want us to tell them the number. The calculator added friction."
```

The CLI refuses to close an experiment without a receipted result. That refusal is the product.

### 7. Look at the whole system

```bash
npx growthos score --explain
npx growthos cockpit --no-open
```

The cockpit is one self-contained HTML file: no CDN, no fonts, no network requests. It includes the score, signal volume, receipt coverage, failing claims, the experiment ledger, and next tests.

## The Growth OS Score

100 deterministic points. No LLM judge in the total.

| Dimension | Points | It asks |
| --- | ---: | --- |
| Evidence integrity | 30 | Do claims resolve to real, unmodified, active signals? |
| Freshness and coverage | 15 | Are we still listening, across more than one channel? |
| Loop closure | 20 | Do experiments end in a receipted decision and a learning? |
| Agent operations | 15 | Are the six jobs defined, approved, and actually run? |
| Memo quality | 10 | Are claims specific, non-duplicative, and honest about gaps? |
| Proof and cockpit | 10 | Can an outsider verify the system? |

Tiers: **Growth OS** 90+, **System** 80+, **Operator** 60+, **Seedling** 40+, **Draft** below 40.

Synthetic demos are labeled `growthOS demo` and can never be certified. A repo with fewer than 20 active signals is capped at 60. `score --explain` shows every point.

Read the full rubric: [docs/scoring.md](docs/scoring.md).

## Evidence rules

`doctor` enforces these without an LLM:

1. Every claim in a memo has at least one `[@sig_...]` receipt.
2. Every cited ID resolves to a signal.
3. Every signal has a non-empty verbatim quote.
4. Every signal has a source URL or an evidence block.
5. The quote hash matches the quote and canonical URL.
6. Cited signals are `active`, not retracted or superseded.
7. Synthetic signals cannot back a published memo.
8. Published memos cannot cite retracted signals.
9. The generated `## Receipts` table matches the claims exactly.
10. `--strict` also rejects stale memos, single-channel evidence, and duplicate claims.

## Agent-native, model-agnostic

growthOS is not another chat UI. It is a substrate:

- **CLI** for humans and CI.
- **Agent Skills** in `skills/` for Claude Code, Codex, Cursor, and any client that reads `SKILL.md`.
- **MCP server** over stdio with read tools plus approval-gated writes (`growthos mcp`).
- **Prompt compiler** that wraps customer text in `<untrusted_signal>` to resist injection.
- **Providers**: a default `command` provider (works with `claude -p`, `codex exec`, Ollama, or any CLI) and an OpenAI-compatible adapter. No SDK lock-in.

```bash
npx growthos mcp --root .
```

## Works with the skills you already use

If you use [marketingskills](https://github.com/coreyhaines31/marketingskills), keep it. Those skills are excellent at copy craft, positioning, and channel tactics. growthOS is the layer underneath: the memory, the receipts, and the decision log. Use both.

## Dogfood

This repository runs its own Growth OS in [`growth/`](growth/). Every launch decision, experiment, and failure is recorded there with public signals and URLs.

- [PROOF.md](PROOF.md) — stars, installs, partner calls, and the experiments behind them.
- [growth/memos/](growth/memos/) — weekly memos with receipts.
- [growth/experiments/](growth/experiments/) — including the ones that failed.

If the system cannot grow growthOS, it does not deserve your repo.

## What this is not

- Not a SaaS or a hosted dashboard.
- Not a scraper. Signals are captured by a human or an approved agent, with a URL and consent.
- Not an auto-DM or auto-publisher. A human approves every send and every publish.
- Not a prompt pack. The skills are thin; the evidence engine is the product.
- Not a replacement for judgment. It makes judgment auditable.

## Honest limitations

- A receipt proves a quote exists at a URL. It does not prove the customer is representative.
- Synthetic examples are labeled and cannot be certified.
- The default score measures system health, not revenue impact.
- AI search answers are stochastic; one probe is not a ranking.
- v0.1 ships three systems as software and three as job specs. The specs are complete enough to run, not turnkey.

## Development

```bash
pnpm install
pnpm demo          # the wow sequence
pnpm test          # 37 tests, including anti-gaming fixtures
pnpm typecheck
pnpm validate:fixtures
pnpm pack:smoke    # install the packed tarball in a clean dir
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Growth Repo Spec v0.1](spec/growth-repo-spec-v0.1.md).

## License

MIT. Built by [@tenwz](https://github.com/tenwz).

If this saves you from shipping one invented customer quote, [give it a star](https://github.com/tenwz/growthos).
