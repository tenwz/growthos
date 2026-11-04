# X launch thread

Post from the founder account, not a product account. Main post is standalone (not a quote post). Attach the 90-second video to post 1 and the failing-terminal screenshot to post 3.

Thread is 8 posts. Verify every block is under 280 characters before scheduling — the character counts below are checked by `pnpm cards --check-launch`.

## Post 1 — the announcement

```text
Every AI marketing tool makes claims.

Almost none can show you the receipt.

So I built growthOS — a growth repo your coding agent can read. Signals in. Evidence-checked memos out. Every claim cites a source.

When one doesn't, the build fails.

npx growthos demo
```

## Post 2 — the problem

```text
The problem isn't that AI can't write.

It's that AI marketing has no memory.

Last quarter's calls, the churn reason, the experiment you already killed — none of it survives. So the model invents a strategy and sounds confident.

Confidence is cheap. Memory isn't.
```

## Post 3 — the demo

```text
Here's the demo.

A memo says: "HVAC owners want an AI SDR."

No source. The audit fails the build:

FAIL  Claim 2: no receipt.

The next memo: 6 claims, 18 receipts, 4 channels. It passes.

Same repo. Same command.

[attach terminal screenshot]
```

## Post 4 — the mechanism

```text
How it works:

1. Capture a signal: verbatim quote, URL, date, consent.
2. Hash the quote. If it changes later, the audit knows.
3. A memo claim must cite [@sig_...].
4. doctor checks every citation, hash, status, and retraction.

No LLM in the evidence path.
```

## Post 5 — what ships

```text
Five folders, six systems. Only three are software in v0.1:

customer-truth → signals + memos
creative-testing → experiment ledger
growth-cockpit → score + static dashboard

Founder content, outbound, and AI search ship as complete job specs, not half-built SaaS.
```

## Post 6 — the score

```text
The score is deterministic: 100 points across evidence, freshness, loop closure, agent ops, memo quality, and proof.

Under 20 signals caps at 60. Synthetic data can't certify a repo.

The cockpit is one self-contained HTML file. No CDN. Works offline.
```

## Post 7 — agent-native

```text
Agent-native by default: Claude Code, Codex, Cursor, or any MCP client. The provider is a CLI command, so no API key is required.

It complements @coreyhaines31's marketingskills: skills teach the craft. growthOS holds the memory and refuses unproven claims.
```

## Post 8 — the ask

```text
I'm pre-launch, under 500 followers, and dogfooding this on growthOS itself. Week 0 numbers are zeros in PROOF.md.

If you run marketing with an agent:

npx growthos demo

Reply with your score. I'll audit the first 30 repos for free — publicly, receipts included.
```

## Quote-post variants

Give each person one variant and one exact time. Never send a generic "would love your support." Replace `@you` with their handle and `[link]` with the launch URL.

### Q1 — for engineers

```text
Marketing claims should fail CI like broken tests do.

@you built something that makes an AI-written memo fail the build when a claim has no source. Every receipt is a hashed quote with a URL.

npx growthos demo
[link]
```

### Q2 — for marketing operators

```text
"Which channel is actually working?" is usually answered with vibes and a dashboard nobody trusts.

This treats every answer as a claim that needs a receipt — verbatim quote, source, date — and keeps the experiment ledger next to it.

[link]
```

### Q3 — for agent builders

```text
Most agent skills teach a model what to say. None of them give the agent a memory it can cite.

growthOS is an MCP server + repo format: signals, memos, experiments, and a deterministic audit. Write tools are approval-gated.

[link]
```

### Q4 — for founders

```text
The scariest thing about AI marketing isn't bad copy. It's confident copy with no source.

A memo now fails the build until every claim points at a real customer quote. That's a low bar. Almost nothing clears it.

[link]
```

### Q5 — for the skeptical

```text
"This is just prompts" — the prompts are 10% of it.

The other 90% is the audit: quote hashes, retraction checks, synthetic-data rules, experiment decisions that require receipts. Run `npx growthos demo` and read the source.

[link]
```

### Q6 — for the Chinese audience (post on X and 即刻)

```text
AI 写营销文案不是问题。问题是它写完就忘，而且从不给出处。

growthOS 把每条结论变成一条带收据的 claim：原话、链接、日期、哈希。没有出处的结论，直接让 build 失败。

npx growthos demo
[link]
```

## Pre-launch DMs (send T-7, follow up T-1)

### To a design-partner prospect

```text
Hey [name] — I'm building an open-source tool for evidence-backed marketing and looking for 30 teams to run a free 60-minute audit on.

You send me 5–10 real customer quotes (public posts are fine). I send back a one-page memo where every claim cites the quote, plus a Growth OS Score for your repo.

No pitch, no email list. I'll ask for an anonymized case study only if the audit is useful. Want one?
```

### To a quote-pool participant

```text
Thanks for offering to help with the launch. Two things, both small:

1. The post is scheduled for [date, 09:05 ET]. I'll send you the exact text at 08:45.
2. Please quote-post it, don't just like it — quote posts carry more weight early.

If the product isn't for you, don't post. A fake endorsement is worse than no endorsement.
```

## Reply playbook (first 90 minutes)

- **"Just use a spreadsheet/Notion."** You can. The difference is the audit runs in CI, and the agent can read it. A spreadsheet cannot fail a build.
- **"LLMs hallucinate; citations don't fix that."** Correct. That is why the evidence layer has no LLM in it. The model drafts; the audit rejects.
- **"Why not build this into [tool]?"** Someone should. The format is open and the CLI is MIT. This is the smallest thing that makes the loop real.
- **"Score is gameable."** Partly. It is deterministic, caps under 20 signals, and excludes synthetic data. The score is a floor, not a certificate of truth.
- **"Show HN didn't go well / nobody cares."** That is data. Ask what they would have needed to see in the first 10 seconds.
- **"Does it scrape?"** No. Capture is manual or agent-assisted, with a URL and consent. No auto-DM, no auto-send.
- **"Will you host it?"** No. Files in your repo, MIT, works offline. A hosted version would break the point.

Do not argue about the category. Ask what evidence they would accept, then point at the file that implements it.

## If the thread underperforms

Do not delete and repost. Post a follow-up with one concrete artifact instead:

```text
Update: 24 hours in.

X people ran the demo. Y repos have a Growth OS Score. The most common failure was [real failure].

Here is the exact fix: [link to a commit or issue]

Still pre-launch. Still writing down the zeros.
```

The numbers must be real. If they are zero, say zero.
