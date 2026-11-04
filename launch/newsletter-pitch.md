# Newsletter and creator pitches

Send individually. One link, one angle, one reason it fits their audience. Do not send a press release.

## The one-line version (use in every pitch)

> growthOS is an MIT-licensed, filesystem-only "growth repo" for coding agents: customer quotes become hashed signals, every marketing claim must cite one, and a deterministic audit fails the build when it doesn't.

## Dev-tools newsletters

Subject lines:

- `Open-source CI for marketing claims (fails on unsourced copy)`
- `A linter for AI-written marketing`

Body:

```text
Hi [name],

Quick pitch for [newsletter], because your readers ship things and write about them.

Most AI marketing tools generate more output. growthOS does the opposite: it rejects output that cannot be traced to a customer quote.

  $ npx growthos demo
  FAIL  Claim 2: "HVAC owners want an AI SDR."
        Claim 2 has no receipt.
  PASS  6 claims, 18 receipts, 4 channels.
  Growth OS Score: 88/100 (System)

The audit is ~10 deterministic rules over SHA-256 quote hashes, citation resolution, retraction state, and synthetic-data provenance. No LLM in the evidence path. There is a GitHub Action, an MCP server, and a JSON Schema for the file format.

It is MIT, TypeScript, no database, no hosted service. The project is also its own test case; the honest week-0 numbers (zeros) are in PROOF.md.

Angle that might fit: "marketing content is the last code path without CI."

Repo: https://github.com/tenwz/growthos
Happy to send screenshots or answer technical questions.

— tenwz
```

## AI / agent newsletters

Subject lines:

- `Giving coding agents a marketing memory they can cite`
- `Agent skills teach the craft; this gives them receipts`

Body:

```text
Hi [name],

You have covered agent skills and MCP servers. This is the missing half of that stack.

growthOS is a repo format + MCP server that gives an agent memory for marketing work: customer signals with quote hashes, memos where every claim cites a signal, and an experiment ledger that refuses to close without a result receipt.

The agent workflow is deliberately boring: compile a job into prompt + context + output schema, run it through a command provider (`claude -p`, `codex exec`, Ollama), validate the output, and write it back only with explicit approval. Signals are wrapped as untrusted data to resist prompt injection.

The interesting design decision: the evidence audit contains no model. The model drafts; a deterministic checker rejects. That makes it usable in CI without trusting the same system that wrote the copy.

Repo: https://github.com/tenwz/growthos (MIT)
Demo runs offline: `npx growthos demo`

If you want a specific angle, the best one is "what happens when the agent's output has to pass a receipt check" — I can send the exact failing claim and the checker code.

— tenwz
```

## Marketing-operator newsletters

Subject lines:

- `A free audit that tells you which marketing claims you cannot prove`
- `Every claim in your memo, with a source`

Body:

```text
Hi [name],

Most marketing teams cannot answer "who said this?" about their own strategy doc. Not because they are careless, but because the quotes live in calls, tickets, reviews, and DMs, and nothing forces the claim to point back at one.

I built growthOS to make that link enforceable. You capture a quote as a signal (URL, date, consent, hash). A memo claim must cite it. An audit fails when it doesn't, and the score shows which parts of the loop are still missing.

I am running 30 free 60-minute audits for teams that use AI for marketing. You send 5–10 real quotes; I send back a one-page memo where every claim cites one, plus a score and the checks that failed. No pitch and no email list.

If a piece on "the unprovable claim" fits [newsletter], I can write it with the actual audit output — including the failures.

— tenwz
```

## Follow-up (once, after 7 days)

```text
One follow-up and then I'll leave you alone. If the angle isn't right, no problem — if it helps, the demo is one command and works offline: `npx growthos demo`. Thanks for the work you put into [newsletter].
```

## Creator / YouTuber pitch

```text
Hi [name],

I watched your [specific video], especially the part about [specific point]. You were skeptical of AI-generated marketing, and I think you'd find the failure mode interesting.

I built an open-source tool that makes an AI-written marketing memo fail the build when a claim has no source. The demo is 4 seconds:

  npx growthos demo

It prints FAIL for the claim "HVAC owners want an AI SDR," then PASS for a memo with 6 claims and 18 receipts, then an 88/100 score. No signup, no hosted service.

If you want to cover it, I can give you:
- a clean recording and the exact commands
- a repo with an intentionally broken claim to react to
- a 15-minute call to explain the evidence rules, including their limits

No sponsorship, no affiliate link. If it's not interesting, that's useful feedback too.
```

## What not to say

- "revolutionary," "game-changing," "10x," "the future of marketing"
- "we're trending on GitHub" (unless it is true, and even then it dates fast)
- "AI agents will replace marketers"
- any number that is not in `PROOF.md`
- any customer name or logo without written approval
