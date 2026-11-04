# Quickstart

Five minutes from zero to a repo that can reject a bad marketing claim.

## Requirements

- Node.js 20 or newer
- A terminal
- Optional: Claude Code, Codex, Cursor, or any MCP client
- Optional: an API key, if you want `task run` to call a model

## 1. Run the demo

```bash
npx growthos demo
```

You will see a synthetic HVAC company called Summit Air. One memo passes. One draft fails because it claims HVAC owners want an AI SDR without a receipt. The cockpit opens in your browser.

The demo creates `growthos-demo/` in the current directory. Delete it whenever you like.

## 2. Create your repo

```bash
npx growthos init my-growth-os --agent all
cd my-growth-os
```

Flags:

- `--template base` (default) or `--template hvac-saas`
- `--agent all | claude | codex | cursor | none`
- `--force` to overwrite a non-empty directory

You get:

```text
.growthos/config.yaml
growth/
  signals/ memos/ experiments/ agents/ cockpit/ content/ outbound/ ai-search/
  company.md icp.md voice.md README.md
AGENTS.md
CLAUDE.md
```

## 3. Capture your first signal

A signal is one verbatim quote from one source. Do not summarize. Do not clean up grammar.

From a public post:

```bash
npx growthos capture \
  --source x_post \
  --url "https://x.com/acme/status/123" \
  --quote "We tried an AI SDR for a month. It booked 3 meetings and 2 were with other AI companies." \
  --segment agency-owner \
  --tags ai-sdr,lead-quality
```

From a customer call (private):

```bash
npx growthos capture \
  --source call \
  --quote "I know we miss calls. I just can't hire another person right now." \
  --summary "Owner knows the cost, blocks on hiring." \
  --segment owner-operator \
  --provenance internal \
  --consent anonymized
```

Check what you wrote:

```bash
npx growthos status
```

## 4. Compile the weekly memo job

```bash
npx growthos task compile job_customer-truth --since 7d
```

Output:

```text
✓ Compiled job_customer-truth
  run       .growthos/runs/run_01...
  signals   9
  prompt    .growthos/runs/run_01.../prompt.md
  output    growth/memos/2026-11-06-whatthemarketistellingus.md
```

Open `prompt.md` and paste it into your agent, or run it:

```bash
npx growthos task run job_customer-truth --apply
```

`--apply` writes the output into the repo. It refuses to overwrite a published memo. Without `--apply`, you can inspect the draft in the run directory.

## 5. Validate

```bash
npx growthos doctor --strict
```

A good memo:

```text
✓ No evidence errors. No warnings.
```

A bad memo:

```text
FAIL  Claim 2 has no receipt. Add [@sig_...] or remove the claim.  growth/memos/draft.md:9
```

Fix the memo, not the linter.

## 6. Run an experiment

```bash
npx growthos experiment new \
  --hypothesis "A missed-call calculator will produce 25 email captures in 14 days because owners cannot estimate the loss themselves." \
  --channel landing-page \
  --metric email_captures \
  --signal sig_01... \
  --baseline 6 \
  --target 25 \
  --guardrail "demo-request rate >= 2%"
```

When results arrive:

```bash
npx growthos experiment log exp_01... \
  --metric email_captures \
  --value 9 \
  --source growth/metrics/2026-w46.json
```

Close it:

```bash
npx growthos experiment decide exp_01... \
  --decision iterate \
  --learning "Owners want us to tell them the number. The calculator added friction."
```

## 7. Generate the cockpit

```bash
npx growthos cockpit --no-open
npx growthos score --explain
```

Commit `growth/cockpit/` if you want a public, static dashboard. The HTML has no external requests.

## 8. Put it in CI

GitHub Actions:

```yaml
name: growth
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: tenwz/growthos@v0.1
        with:
          strict: true
          min-score: 60
```

## Troubleshooting

**"No growthOS repo found"**
Run from inside the repo, or pass `--root <path>`.

**"Public signals need a URL"**
Use `--provenance internal` for private notes, or provide `--url`.

**"Missing generated ## Receipts table"**
Run `npx growthos task run <job> --apply`, or let `doctor` tell you which claims need receipts. The table is generated, never hand-written.

**A quote hash fails**
The quote or URL changed after capture. Capture a new signal that `supersedes` the old one; do not edit history.

**The score is capped at 60**
You have fewer than 20 active signals. Capture more evidence or lower `score.min_signals` in `.growthos/config.yaml` (not recommended for a public score).
