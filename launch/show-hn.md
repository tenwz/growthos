# Show HN

Post as a text post. Link the repo in the body, not the title. Do not ask for upvotes anywhere. Reply to every technical question for the first three hours.

## Title (choose one, 80 chars max)

1. `Show HN: growthOS – evidence-first marketing repo for coding agents` (68)
2. `Show HN: A growth repo that fails the build on unsourced marketing claims` (74)

Use #1. #2 is the backup if #1 is flagged as unclear.

## Body

```text
I kept watching coding agents write marketing copy that was fluent, confident, and impossible to verify. The model had no memory of last week's customer calls, and nothing in the workflow required a source. So I built a file format and a CLI that make unsourced claims fail.

growthOS is a folder your agent can read:

  growth/
    signals/       verbatim quotes + URL + date + consent + SHA-256
    memos/         claims that must cite [@sig_...]
    experiments/   hypothesis -> metric receipt -> decision -> learning
    agents/        job specs for the agent
    cockpit/       one self-contained HTML dashboard

The audit is deterministic and has no LLM in it. It checks that every claim cites a signal, every signal resolves, every quote hash still matches, no published memo cites a retracted signal, and synthetic data cannot certify a repo.

Demo:

  $ npx growthos demo
  FAIL  growth/memos/2026-11-03-draft-missed-call-ai.md
        Claim 2: "HVAC owners want an AI SDR."
        Claim 2 has no receipt. Add [@sig_...] or remove the claim.
  PASS  growth/memos/2026-11-05-whatthemarketistellingus.md
        6 claims, 18 receipts, 4 channels.

  Growth OS Score: 88/100 (System)

The score is 100 deterministic points: evidence 30, freshness 15, loop closure 20, agent operations 15, memo quality 10, proof 10. Repos under 20 signals cap at 60. Synthetic signals are excluded from certified scores.

The agent side is model-agnostic. The default provider runs a command (`claude -p`, `codex exec`, Ollama), so no API key is required. There is also an MCP server: read tools are open, write tools default to dry-run and require approval.

It is MIT, TypeScript, filesystem-only. No database, no hosted service, no scrapers, no auto-DM. The repo is also its own test case: growth/ contains 20 real public signals and a memo that scores 82/100.

What I would like feedback on:

1. Is the signal/memo/experiment format missing a field you would need in practice?
2. Does the evidence checker have a bypass I missed?
3. Is the 100-point rubric measuring the right things, or is it measuring what is easy to check?

Limitations, stated plainly: the sample is 20 Hacker News comments and GitHub issues, not a representative customer base. The score is a floor, not proof of truth. Three of the six systems are job specs, not software. And there are zero users so far, so the numbers in PROOF.md are zeros.

Repo: https://github.com/tenwz/growthos
```

## First comment (post immediately after submitting)

```text
A few implementation notes that did not fit in the post.

Quote integrity: the hash is SHA-256 over the normalized quote (whitespace collapsed, Unicode NFKC), the canonicalized URL (tracking params stripped), and the published date. Editing the quote after capture breaks the audit, which is intentional.

Prompt injection: compiled agent jobs wrap every signal in <untrusted_signal> tags and the output contract rejects text outside the expected file blocks. Signals are data, not instructions.

Scoring determinism: same repo in, same score out. Timestamps do not affect points except freshness, which is computed at audit time. `score --explain` prints every check and its points so the number can be argued with.

What is deliberately not here: a web app, a database, auth, hosted sync, scraping, auto-send. If the workflow needs a server to be useful, I built the wrong thing.

Happy to answer anything about the format or the checker.
```

## Hostile-question FAQ

Answer in one or two sentences, then point at code. Do not get defensive; HN rewards specificity.

**"This is just prompts with extra steps."**
The prompt is a small part. The load-bearing code is the evidence checker: 10 rules over quote hashes, citation resolution, retraction state, and provenance. Run `npx growthos demo` and read `packages/core/src/evidence/check.ts`.

**"Citations don't prevent hallucination."**
Agreed. The model can still invent a claim that cites a real-but-irrelevant quote. The audit catches unsourced claims, tampered quotes, retracted sources, and synthetic data used as proof. It cannot judge relevance. That is why the memo has a "what we are not saying" section and why experiments need result receipts.

**"The score is gameable."**
Yes, partly. It is deterministic, caps at 60 below 20 signals, excludes synthetic signals from certification, and requires a passing memo and a closed experiment for full loop points. It is a floor, not a certificate. The rubric is public and I expect people to argue with it.

**"Why not use Notion/Airtable/a spreadsheet?"**
You can store the data there. You cannot make it fail CI, and an agent cannot read it without an integration. The point is that the repo is the interface.

**"Why six systems if three are specs?"**
Because marketing is six jobs, but only three need software to close the loop. Founder content, outbound, and AI search are job specs with quality bars; they write signals back into the same repo. Shipping half-built UIs for them would be worse.

**"Does this scrape X/Reddit?"**
No. Capture is manual or agent-assisted and requires a URL and consent. There is no scraper and no auto-DM in the codebase. That is both an ethical and a practical choice: scraped quotes do not survive a retraction check.

**"Is this an ad?"**
It is an open-source project I wrote, posted to Show HN, which is where people post projects. No signup, no email capture, no paid tier. If it is not useful, say so and I will learn something.

**"What happens when a signal is deleted?"**
The memo citing it fails with `memo.claim.missing_signal`. Signals are append-only; the correct move is `status: retracted`, which still fails any published memo that cites it.

**"Why is the dogfood score only 82?"**
Because loop closure is 8/20: two experiments are proposed, none has a result. That is the honest state. The score is doing its job.

**"Windows support?"**
CI runs lint, typecheck, test, and build on Windows. Path handling and the static cockpit are tested there. Report anything that breaks.

## If it gets traction

- Move the top three questions into `docs/faq.md` with the exact wording people used.
- Open a `good first issue` for each fair criticism you are not fixing today.
- Post one follow-up comment with the first external repo that runs the audit, including its real score.
- Do not edit the post to add "we're #1 on HN." Nobody cares, and it dates the post.
