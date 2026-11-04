# Your Growth OS

This folder is the company's durable marketing memory. It is not a prompt pack and it is not a dashboard. It is the place your agents read from and write back to.

## The loop

```
capture → compile → draft → doctor → experiment → measure → learn → repeat
```

## Folders

| Folder | What lives here |
| --- | --- |
| `signals/` | Immutable receipts: verbatim quotes, source URLs, support tickets, call notes, metrics |
| `memos/` | `whatthemarketistellingus.md` and rejected drafts |
| `experiments/` | Hypothesis → asset → results → decision → learning |
| `agents/` | Job specs for the six systems |
| `learnings/` | What the experiments taught you |
| `metrics/` | Weekly pipeline, stars, installs, or product metrics |
| `evals/` | Score runs and quality gates |
| `cockpit/` | Generated static cockpit, badge, and share card |

## Hard rules

1. A claim without a receipt is a bug.
2. Signals are append-only. Correct by adding a new signal that references the old one.
3. Published memos are immutable. Corrections create a new memo with `supersedes`.
4. Agents draft. Humans publish and send.
5. Never invent a quote, URL, customer, number, or date.
6. Synthetic data is always marked `provenance: synthetic`.

## Start here

```bash
npx growthos capture --source x --url https://x.com/... --quote "the exact words" --segment founder
npx growthos task compile customer-truth
npx growthos doctor --strict
npx growthos score --explain
npx growthos cockpit --open
```
