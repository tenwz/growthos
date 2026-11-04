---
name: growthos-founder-content
description: Draft founder-led posts and threads grounded in real customer signals. Use for build-in-public, X/LinkedIn posts, launch threads, and content that must cite receipts.
---

# Founder Content

Write like a founder who was in the customer conversation, not like a brand account. The unit is **one specific observation from one real signal**, not a listicle.

## Process

1. Search signals for a tension, surprise, or costly mistake:

```bash
npx growthos task compile job_founder-content --since 14d
```

2. Pick **one** signal. A post with one vivid, verbatim detail beats a post with six generic lessons.
3. Write the post.
4. Run the receipts check: every factual claim about customers links to `[@sig_...]` in the internal draft. Public copy may hide IDs, but the draft must keep them.
5. Add the post to `growth/content/drafts/`. Never publish directly.

## Structure that works

```text
Hook: the surprising thing a customer said or did.
Context: who, when, and what it cost them.
Turn: what you believed before, and why the signal changed it.
Implication: what you are changing or testing.
CTA: one question that invites a real answer.
```

Constraints:

- First line must stand alone in the feed.
- One idea per post. Threads are for evidence, not for padding.
- No fake vulnerability, no invented revenue numbers, no "we're humbled."
- Use the customer's words. Attribute only with consent.
- 2–4 word visual headline if a card is produced.

## Good vs. bad

Bad: "5 lessons I learned from talking to 100 customers."
Good: "An HVAC owner told me he loses $4,800 a month to missed calls. He knew the number. He still hadn't fixed it. Here's the reason he gave me — and it wasn't the software."

## Output contract

Write `growth/content/drafts/YYYY-MM-DD-<slug>.md`:

```markdown
---
schema: growthos/content@1
channel: x
status: draft
source_signals: [sig_..., sig_...]
created_at: 2026-11-08T17:00:00Z
---

# <working title>

<post or thread>

## Receipts

- <claim> — [@sig_...]
```

Then report: the hook, the signal behind it, and what a human must verify before posting. Publishing always requires explicit human approval.
