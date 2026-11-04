# MCP server

growthOS ships a local stdio MCP server so any MCP-compatible agent can read the Growth OS without shell access.

```bash
npx growthos mcp --root .
```

It never opens a network port and never runs a shell command. Signals and memos are read from disk on each tool call.

## Configure Claude Code

Add to `.mcp.json` in your repo:

```json
{
  "mcpServers": {
    "growthos": {
      "command": "npx",
      "args": ["--yes", "growthos", "mcp", "--root", "."]
    }
  }
}
```

Restart Claude Code and ask: "What is the market telling us this week?"

## Configure Codex / other clients

Any client that supports stdio MCP can use the same command. The server writes diagnostics to stderr only.

## Tools

### Read tools

| Tool | Arguments | Returns |
| --- | --- | --- |
| `growthos_status` | none | Counts, evidence errors, score, tier |
| `growthos_search_signals` | `query`, `segment`, `tag`, `kind`, `limit` | Matching active signals |
| `growthos_get_signal` | `id` | One signal with source and hash |
| `growthos_get_memo` | `file` | Memo frontmatter and body (defaults to latest) |
| `growthos_validate_memo` | `file`, `strict` | Exact failing claims and rules |
| `growthos_score` | `explain` | Score with every check |
| `growthos_list_experiments` | none | Experiment ledger |

### Write tools

Writes are constrained:

| Tool | Safety |
| --- | --- |
| `growthos_capture_signal` | `dry_run: true` by default; public signals require a URL |
| `growthos_create_experiment` | Creates a proposal; a human runs it |
| `growthos_log_experiment_result` | Requires a receipt |
| `growthos_decide_experiment` | Requires a receipted result and a learning |
| `growthos_compile_job` | Writes only under `.growthos/runs/` |
| `growthos_build_cockpit` | Writes only under `growth/cockpit/` |

There is no tool for publishing a memo, sending a message, or editing a published memo. Those remain human actions.

## Resources

- `growthos://spec` — a short spec summary with repo counts
- `growthos://signals` — all signals as JSON

## Prompts

- `weekly-customer-truth` — draft the weekly memo, validate it, and fix every error before proposing it.

## Security model

1. **Local only.** No HTTP listener, no outbound calls.
2. **Explicit root.** The server only reads the root passed on the command line.
3. **Untrusted customer text.** Returned quotes are data. The server does not execute them.
4. **Human approval.** No send or publish tool exists.
5. **No secrets.** The server does not read environment API keys.

## Smoke test

The test suite connects an in-memory client, lists tools, calls `growthos_status`, validates the intentionally broken memo, and checks that capture is dry-run by default:

```bash
pnpm test -- packages/mcp
```
