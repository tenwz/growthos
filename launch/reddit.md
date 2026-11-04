# Reddit

Three different posts, not one post copied three times. Each subreddit has its own culture and self-promotion rules; read the sidebar before posting and answer mod questions politely.

Post r/opensource first. Wait at least three hours before the next. Never crosspost the same text.

## r/opensource

Rules that matter: disclose that you are the author, no referral links, no low-effort promotion.

**Title:** `growthOS: an MIT-licensed, filesystem-only marketing repo that fails the build on unsourced claims`

**Body:**

```text
I'm the author. This is MIT, no hosted service, no signup.

I built it because coding agents write marketing copy that sounds confident and cannot be checked. growthOS is a folder format plus a CLI that makes claims cite evidence:

  growth/signals/      verbatim quote, URL, date, consent, SHA-256 of the quote
  growth/memos/        claims that must cite [@sig_...]
  growth/experiments/  hypothesis -> metric receipt -> decision -> learning
  growth/agents/       job specs for Claude Code / Codex / any agent
  growth/cockpit/      one self-contained HTML dashboard

The audit is deterministic and contains no LLM. It checks citation resolution, quote hashes, retraction state, synthetic-data rules, and whether the receipts table matches the claims.

  $ npx growthos demo

One memo intentionally fails on a claim with no receipt. The other passes with 6 claims and 18 receipts. The demo writes a cockpit and a score; the sample is 88/100.

There are also an MCP server, a GitHub Action for CI, and JSON Schemas for the file format.

Things it deliberately does not do: scrape, auto-DM, auto-publish, host data, or require an API key. The default provider is a shell command, so `claude -p` or `codex exec` works.

Known weaknesses: 37 tests, v0.1, three of the six systems are job specs rather than code, and the dogfood dataset is 20 public HN/GitHub signals, not a representative sample.

I would value a code review of `packages/core/src/evidence/check.ts` more than stars. If you find a way to pass the audit with a fabricated quote, that is the bug I care about.

Repo: https://github.com/tenwz/growthos
```

## r/SideProject

Rules that matter: keep it conversational, say what it is, no fake milestones.

**Title:** `I got tired of AI marketing copy with no sources, so I made unsourced claims fail the build`

**Body:**

```text
Every AI marketing tool I tried optimized the same thing: more output. None of them could answer "who said this?"

So I built growthOS. It stores customer quotes as signals, requires every memo claim to cite one, and runs an audit that fails when a claim has no receipt.

The demo is the whole idea in one command:

  npx growthos demo

  FAIL  Claim 2: "HVAC owners want an AI SDR."
        Claim 2 has no receipt.
  PASS  6 claims, 18 receipts, 4 channels.
  Growth OS Score: 88/100 (System)

It is open source, MIT, and runs offline. No account, no database. You can use Claude Code, Codex, Cursor, or nothing at all.

I'm dogfooding it on the project itself, including the embarrassing parts: the score is 82/100 because no experiment has closed yet, and the week-0 numbers are all zeros in PROOF.md.

What I'm unsure about: whether marketing teams will actually write claims in Markdown, or whether this only fits engineers who happen to do marketing. If you have tried to run a content workflow out of a repo, I would like to hear where it broke.
```

## r/ClaudeAI

Rules that matter: show the actual agent workflow, no "10x your business" language.

**Title:** `I gave Claude Code a marketing memory: signals, receipts, and an audit that rejects unsourced claims`

**Body:**

```text
Most agent skills teach Claude what to say. This is the other half: a repo Claude can read and a checker that refuses claims without evidence.

The repo layout:

  growth/signals/      verbatim customer quotes with source URL + hash
  growth/memos/        claims citing [@sig_...]
  growth/experiments/  hypothesis, metric receipt, decision, learning
  growth/agents/       six job specs (customer truth, founder content, outbound, creative testing, AI search, cockpit)

The CLI compiles a job into prompt.md + context.json + output.schema.json. Every signal is wrapped in <untrusted_signal> so customer text cannot act as instructions. The default provider is a command, so this works with `claude -p` without an API key.

  growthos task compile customer-truth
  growthos task run customer-truth --provider command --apply

There is also an MCP server. Read tools (status, search signals, validate memo, score) are always available. Write tools default to `dry_run: true`, and experiment decisions require a result with a receipt.

The part I care most about: the evidence audit has no LLM in it. The model drafts; the audit rejects. That separation is what makes it useful in CI.

  npx growthos demo

Repo: https://github.com/tenwz/growthos

If you already use Claude Code for marketing, I would like to know which part of the job spec is unrealistic, and whether the output contract is too strict for real drafting.
```

## Comment replies

- **"Reddit self-promo, reported."** "Fair. I'm the author, it's MIT, and I'm here for code review. If the mods want it removed, that's their call."
- **"Does it work with local models?"** "Yes. The provider is a command; Ollama is documented. The evidence audit is model-independent."
- **"Why not a SaaS?"** "Because the audit needs to run in CI, against files in your repo, without your data leaving. A SaaS would make the trust problem worse."
- **"Too much setup."** "`npx growthos demo` is one command and needs no setup. `init` scaffolds the repo. If you get stuck, tell me where."
- **"Marketing people won't use Git."** "Probably true for some teams. This is for teams where the marketer works next to the engineer, or where the founder is the marketer. That is the wedge, not the whole market."

## Do not

- Do not post in r/marketing or r/Entrepreneur without reading their rules; both are hostile to tool promotion and often ban it.
- Do not use alt accounts to agree with yourself.
- Do not ask for upvotes.
- Do not post all three in one hour.
- Do not delete a post that gets criticism. Respond once, then leave it.
