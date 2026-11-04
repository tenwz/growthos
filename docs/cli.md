# CLI reference

`growthos` is one binary with ten commands. Every command supports `--root <path>` where it makes sense, and exits with a stable code.

## Exit codes

| Code | Meaning |
| ---: | --- |
| `0` | Success |
| `1` | Validation or evidence failure |
| `2` | Usage error |
| `3` | Provider or network error |
| `4` | Score below `--min` |

Use `--json` on `demo`, `doctor`, `capture`, `status`, `task`, `experiment`, and `score` for machine-readable output.

## `init [dir]`

Scaffold a Growth OS.

```bash
npx growthos init my-growth-os --template base --agent all
```

| Flag | Values | Default |
| --- | --- | --- |
| `--template` | `base`, `hvac-saas` | `base` |
| `--agent` | `claude-code`, `codex`, `cursor`, `all`, `none` | `all` |
| `--force` | boolean | `false` |

`--agent` controls which agent instruction files are written: `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/growthos.mdc`.

## `demo`

Create a complete synthetic repo, audit it, render the cockpit, and open it.

```bash
npx growthos demo --dir growthos-demo --no-open
```

| Flag | Default |
| --- | --- |
| `--dir <dir>` | `growthos-demo` |
| `--no-open` | opens the cockpit by default |
| `--json` | off |

The demo is offline and deterministic. It is the reference acceptance test.

## `doctor [path]`

Validate config, schemas, IDs, claims, receipts, hashes, provenance, experiments, jobs, proof, and secrets.

```bash
npx growthos doctor --strict
```

| Flag | Meaning |
| --- | --- |
| `--strict` | Treat stale memos, low diversity, duplicate claims, and missing sections as errors |
| `--json` | Machine-readable issues and checks |
| `--root <path>` | Repo root |

Exit code `1` if there is at least one error.

## `capture`

Create an immutable signal.

```bash
npx growthos capture \
  --source x_post \
  --url "https://x.com/acme/status/123" \
  --quote "We tried an AI SDR for a month..." \
  --summary "Agency owner rejects AI SDR." \
  --segment agency-owner \
  --tags ai-sdr,lead-quality \
  --provenance public \
  --consent public
```

| Flag | Required | Notes |
| --- | --- | --- |
| `--quote` | yes | Verbatim words from the source |
| `--source` | yes | `x_post`, `reddit_comment`, `hn_comment`, `github_issue`, `interview`, `support_ticket`, `review`, `survey`, `call`, `metric`, `note`, `other` |
| `--url` | public signals | Any valid URL |
| `--summary` | no | Neutral one-line summary |
| `--segment` | no | Customer segment |
| `--tags` | no | Comma-separated |
| `--provenance` | no | `public`, `internal`, `synthetic` (default `public`) |
| `--consent` | no | `public`, `internal`, `anonymized` (default `public`) |
| `--published-at` | no | Source timestamp |
| `--dry-run` | no | Print without writing |
| `--json` | no | Machine-readable |

The CLI computes `integrity.quote_hash` for you. Never edit a signal by hand after capture; capture a superseding signal instead.

## `status`

Repo health at a glance: active signals, channels, segments, primary memo, claims, experiments, jobs, score, and evidence errors.

```bash
npx growthos status --json
```

## `task list`

List job specs and their outputs.

```bash
npx growthos task list --json
```

## `task compile <job>`

Build `prompt.md`, `context.json`, `output.schema.json`, and `manifest.json` in `.growthos/runs/<run_id>/`.

```bash
npx growthos task compile job_customer-truth --since 7d --segment owner-operator --tag missed-calls
```

| Flag | Meaning |
| --- | --- |
| `--since` | `7d`, `14d`, or an ISO date |
| `--segment` | Filter by segment |
| `--tag` | Filter by tag |
| `--max-signals` | Cap (default 40) |
| `--json` | Print the manifest |

Job IDs: `job_customer-truth`, `job_founder-content`, `job_outbound-signal`, `job_creative-testing`, `job_ai-search-visibility`, `job_growth-cockpit`.

## `task run <job>`

Compile, call the provider, validate the output, and optionally apply it.

```bash
npx growthos task run job_customer-truth --apply
```

| Flag | Meaning |
| --- | --- |
| `--provider` | `command` or `openai-compatible` |
| `--model` | Model override |
| `--apply` | Write output into the repo (default: draft only) |
| `--json` | Machine-readable result |

Published memos are never overwritten. Without `--apply`, the output stays in the run directory and a diff is written.

## `experiment new`

```bash
npx growthos experiment new \
  --hypothesis "..." \
  --channel landing-page \
  --metric email_captures \
  --signal sig_01... \
  --baseline 6 \
  --target 25 \
  --guardrail "demo-request rate >= 2%"
```

| Flag | Required |
| --- | --- |
| `--hypothesis` | yes |
| `--channel` | yes |
| `--metric` | yes |
| `--signal` | repeatable, optional |
| `--audience`, `--baseline`, `--target`, `--guardrail`, `--owner`, `--end-at` | optional |

## `experiment list`

Lists every experiment with status, target, observed value, decision, and result count.

```bash
npx growthos experiment list --root . --json
```

## `experiment log <id>`

Append a result row. A receipt is mandatory.

```bash
npx growthos experiment log exp_01... --metric email_captures --value 9 --source growth/metrics/w46.json
```

## `experiment decide <id>`

Close an experiment. Requires a receipted result and a written learning.

```bash
npx growthos experiment decide exp_01... --decision iterate --learning "..."
```

Decisions: `scale`, `iterate`, `kill`, `inconclusive`.

## `score [path]`

Compute the Growth OS Score.

```bash
npx growthos score --explain --badge --min 60
```

| Flag | Meaning |
| --- | --- |
| `--explain` | Print every check |
| `--badge` | Write `badge.json` and `badge.svg` into `growth/cockpit/` |
| `--min <score>` | Exit code `4` below this score |
| `--json` | Full score object |

## `cockpit`

Generate `index.html`, `badge.json`, `badge.svg`, and `share-card.svg` in `growth/cockpit/`.

```bash
npx growthos cockpit --no-open --theme dark
```

| Flag | Meaning |
| --- | --- |
| `--no-open` | Do not open a browser |
| `--theme` | `dark` or `light` |
| `--out <file>` | Also write the HTML elsewhere |
| `--root <path>` | Repo root |

The command runs twice: once to create the cockpit (which earns proof points), then again to score the refreshed repo.

## `mcp`

Start the local stdio MCP server.

```bash
npx growthos mcp --root .
```

See [mcp.md](mcp.md).

## Providers

Configure in `.growthos/config.yaml`:

```yaml
providers:
  default: command
  command:
    cmd: ["claude", "-p"]       # or ["codex", "exec"], ["ollama", "run", "llama3.1"]
    timeout_seconds: 900
```

Or:

```yaml
providers:
  default: openai-compatible
  openai_compatible:
    base_url: https://api.openai.com/v1
    model: gpt-4.1-mini
    api_key_env: OPENAI_API_KEY
```

The prompt is sent on stdin; stdout is the result. growthOS never stores API keys.
