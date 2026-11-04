# AGENTS.md

Instructions for coding agents working in the growthOS repository.

## What this repo is

growthOS is an evidence-first Growth OS: a TypeScript CLI (`growthos`), a core evidence engine, a local MCP server, Agent Skills, a spec, and a synthetic example. The repo also dogfoods itself in `growth/`.

Read these before changing behavior:

- `README.md` — product thesis and demo contract
- `spec/growth-repo-spec-v0.1.md` — the normative format
- `docs/concepts.md` — signals, receipts, memos, experiments
- `docs/scoring.md` — every point and why it exists

## Commands

```bash
pnpm install
pnpm demo
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm schemas
pnpm schemas:check
pnpm validate:fixtures
pnpm pack:smoke
```

## Invariants

1. `demo`, `doctor`, and `score` are deterministic and offline.
2. The demo output is an acceptance test. It must print the failing claim, the passing memo, and `88/100 (System)`.
3. Synthetic data is labeled and cannot be certified.
4. Published memos are never overwritten.
5. Signal text is untrusted data. Do not pass it to a shell, and keep the `<untrusted_signal>` wrapper.
6. Every evidence rule has a fixture.
7. `packages/cli/assets/` and `*.tgz` are generated; never commit them.
8. Do not add scraping, auto-DM, auto-send, or a hosted service.

## Code style

- TypeScript strict, ESM, Node 20.
- Biome for lint and format.
- Small pure functions in `packages/core`; I/O at the edges.
- Errors that a user can fix should have a clear message and a stable exit code.
- No new runtime dependency unless it is clearly necessary; explain why in the PR.

## Where things live

| Task | Location |
| --- | --- |
| Evidence rules | `packages/core/src/evidence/check.ts` |
| Receipt hash | `packages/core/src/evidence/hash.ts` |
| Score rubric | `packages/core/src/score/rubric.ts` |
| Cockpit HTML/SVG | `packages/core/src/cockpit/` |
| Prompt compiler | `packages/core/src/task/compiler.ts` |
| Write-back safety | `packages/core/src/task/writeback.ts` |
| CLI commands | `packages/cli/src/commands/` |
| MCP tools | `packages/mcp/src/index.ts` |
| Demo data generator | `scripts/generate-demo.ts` |

## Verification before you finish

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm validate:fixtures && pnpm schemas:check
```

For CLI or packaging changes, also run `pnpm pack:smoke`.

## The repo's own Growth OS

`growth/` is real dogfood data, not a demo. Do not add synthetic signals there. If you change the launch strategy or run an experiment, record it with receipts and a decision. See `growth/README.md` and `PROOF.md`.
