# Design-partner program

Free 60-minute Growth Repo Audit for the first 30 teams. The goal is not leads. It is proof: real repos, real quotes, real experiments, and case studies that can be checked.

**Offer:** one audit, one page, every claim cited. No email list, no pitch deck, no paid tier.

## Who it is for

- A team of 1–15 where marketing and engineering sit together.
- Already using an AI agent for content, outbound, or research.
- Has at least 5 real customer conversations they can quote (public posts are fine).
- Willing to run one experiment and record the result, even if it fails.

Not a fit: teams that need a hosted dashboard, teams that cannot share any quote even anonymized, agencies looking for white-label content generation.

## One-pager

```text
GROWTH REPO AUDIT
A free, 60-minute evidence audit for teams that use AI agents for marketing.

THE PROBLEM
AI can write a strategy in 30 seconds. It cannot tell you which sentence is true.
Most teams have no record of what customers actually said, so every new
strategy starts from a plausible guess.

WHAT WE DO
1. You send 5–10 verbatim customer quotes with links (public posts, reviews,
   support tickets, call notes). Names can be removed.
2. We turn them into a growthOS repo: signals with hashes, one memo where every
   claim cites a signal, and one experiment with a baseline and a target.
3. We run a deterministic audit and a 100-point score.
4. You get a one-page memo and a cockpit. Nothing is published without approval.

WHAT YOU GET
- A one-page memo: 5–7 claims, every one with a receipt.
- A list of claims you cannot make yet, because the evidence is missing.
- One experiment defined with a metric and a guardrail.
- A Growth OS Score for the repo, plus the exact checks that lost points.

WHAT WE ASK
- 60 minutes, once.
- Permission to use an anonymized version as a case study if it is useful.
- One sentence of honest feedback, including if it was not useful.

WHAT WE DO NOT DO
- No scraping, no auto-DM, no auto-publishing.
- No access to your CRM or ad accounts.
- No use of your data to train anything.
- No claim that the score proves your marketing works. It proves the evidence
  is checkable.

COST
Free for the first 30 teams. The software is MIT and stays free.
```

## Outreach DM

Send after engaging with something they actually wrote. Never send this cold to a stranger with no context.

```text
Hey [name] — your post about [specific thing] matched something I keep seeing: teams using agents for marketing have no record of what customers actually said, so every strategy starts from a guess.

I'm running 30 free 60-minute Growth Repo Audits to test whether an evidence-first workflow is useful outside my own repo. You send 5–10 real customer quotes with links; I send back a one-page memo where every claim cites a quote, plus a score and the checks that failed.

No pitch, no list. If it's useful, I'll ask whether I can write an anonymized case study. If it isn't, I'll ask why.

Want the slot on [date]?
```

Follow-up after 5 days, once:

```text
One follow-up, then I'll stop: the audit is still open, and I have [N] slots left this month. If the timing is wrong, no problem — the tool is MIT and `npx growthos demo` runs offline.
```

Do not send a third message.

## 60-minute agenda

| Minutes | What |
| --- | --- |
| 0–5 | Confirm what they want from the audit. Write it down in their words. |
| 5–15 | Walk through the 5–10 quotes. Ask: what did you change because of this? What did you assume instead? |
| 15–25 | Draft claims together. Kill every claim that cannot cite a quote. This is the uncomfortable part and the most valuable. |
| 25–35 | Build the repo live: `growthos init`, capture signals, write the memo. They watch, or drive. |
| 35–45 | Run `doctor --strict` and `score --explain`. Read the failures out loud. |
| 45–55 | Define one experiment: hypothesis, metric, baseline, target, guardrail, decision date. |
| 55–60 | Agree next step and permission. Ask the one feedback question: "What would make you not use this next week?" |

Recording: ask permission first. If they decline, take notes and send them for correction.

## Intake form (plain text or Tally)

1. Name, role, team size.
2. What marketing motion are you running now?
3. Which agent or tool do you use for it?
4. Link to your site or repo.
5. 5–10 verbatim customer quotes. Each needs: quote, where it came from (URL or channel), approximate date.
6. Which quote surprised you?
7. What claim do you make that you could not prove today?
8. Can we use an anonymized version as a case study? (yes / ask first / no)
9. Anything that must never be quoted?

If they cannot supply 5 quotes, do not run the audit. Offer to help them capture 5 first; that conversation is itself the research.

## Audit memo template

```markdown
# Growth Repo Audit — [company]

**Date:** YYYY-MM-DD
**Auditor:** tenwz
**Evidence:** [N] signals, [M] channels, [K] receipts
**Consent:** [public / anonymized / internal only]

## What we heard

1. **[Claim].** [One sentence of interpretation.] [@sig_...]
2. ...

## What we are not saying

- We do not have evidence for [claim], even though it is commonly assumed.
- [N] of the quotes come from [channel], which may not represent [segment].

## What the evidence cannot tell us

- Whether [outcome] changes if you [action].
- Whether this holds for [segment] outside the sample.

## One test

**Hypothesis:** If we [action] for [audience], then [metric] moves from [baseline] to [target] in [window].
**Guardrail:** [metric] must not fall below [threshold].
**Receipt:** [where the result will be recorded].

## Score

[Score]/100 ([Tier]) — [one sentence on the biggest gap].

## What would change our mind

- [Specific observation that would falsify claim 1.]
```

Every claim line must end with `[@sig_...]`. If the memo does not pass `growthos doctor --strict`, it is not sent.

## After the audit

1. Send the memo within 48 hours, with the exact command to reproduce the score.
2. Ask one question: "Which claim in here do you disagree with?"
3. If they agree to a case study, send the draft and the exact quotes for approval. Never publish before written approval.
4. Add the result to the experiment ledger. A "no" is a result. Record it.
5. Update `PROOF.md` with the number of audits completed, not the number offered.

## Case-study format (only with written approval)

- Who they are, in their words (or "a 6-person dev-tools startup").
- The claim they could not prove before.
- The quote that changed the claim.
- The experiment, the result, and the decision — including failures.
- One sentence on what they would not do again.
- Link to their repo or site only if they ask for it.

No logos until a signed or emailed approval is on file. No exceptions.
