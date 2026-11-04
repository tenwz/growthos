---
name: growthos-outbound-signal
description: Build evidence-based outbound angles and account lists from public signals. Use for prospecting research, personalized cold email drafts, and reply-worthy outreach. Never sends anything.
---

# Outbound Signal

Outbound is not volume. It is **public signal → specific pain → plausible help**. You research; a human approves and sends.

## Hard boundaries

- No scraping tools, no browser automation, no bulk profile pulls.
- No auto-DM, no auto-send, no enrichment APIs that violate a platform's terms.
- Work only from public posts and material the user provides with consent.
- One message per account. No sequences pretending to be personal.
- If you cannot find a public signal, the account is not qualified. Say so and move on.

## Process

1. Read `growth/icp.md` and the latest memo.
2. Compile the job:

```bash
npx growthos task compile job_outbound-signal --since 30d --tag outbound
```

3. For each account, find **one** public signal: a complaint, a launch, a hiring post, a workflow described in their own words.
4. Capture it as an internal signal with a URL and a verbatim quote.
5. Draft the message.
6. Stop. Put drafts in `growth/outbound/drafts/`. A human reviews and sends.

## Message structure

```text
Line 1: the signal you actually read (specific enough that it could not be copied to another account).
Line 2: the cost or consequence, in their words.
Line 3: one small, relevant thing you can offer — an idea, a teardown, a number, not a demo request.
Line 4: a low-friction question.
```

Constraints:

- Under 90 words.
- No "I noticed you're the founder of..." flattery.
- No attachments, no calendar links, no fake urgency.
- Every account row must include the source URL and the evidence receipt ID.
- If the signal is older than 30 days, mark it stale.

## Account list contract

`growth/outbound/YYYY-MM-DD-account-list.md`:

| Account | Segment | Public signal | Signal ID | Angle | Status |
| --- | --- | --- | --- | --- | --- |
| example.com | owner-operator | "We miss 20 calls a week" | sig_... | missed-call recovery | draft-ready |

Report the list size, how many have a real signal, and how many you rejected for lack of evidence. Never report "leads" you cannot cite.
