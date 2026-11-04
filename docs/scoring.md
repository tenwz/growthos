# Growth OS Score

The score answers one question: **is this a working growth system, or a folder of vibes?**

It is deterministic, offline, and auditable. `score --explain` prints every check and every point.

## Tiers

| Score | Tier | Meaning |
| ---: | --- | --- |
| 90–100 | Growth OS | Closed loop, strong evidence, public proof |
| 80–89 | System | Real system with one or two weak dimensions |
| 60–79 | Operator | Useful, but the loop or evidence is incomplete |
| 40–59 | Seedling | Early; not enough evidence to trust |
| 0–39 | Draft | Scaffold, demo, or broken |

## Dimensions

### Evidence integrity — 30 points

| Check | Points | How to earn it |
| --- | ---: | --- |
| Claim coverage | 12 | Every claim in the primary memo has a receipt |
| Verbatim quotes | 6 | Cited signals contain substantive quotes (20+ chars) |
| Public sources | 4 | Active public signals have a source URL |
| Source diversity | 4 | The primary memo draws on 3+ channels (2 gets half) |
| Hash integrity | 4 | Every signal's quote hash verifies |

### Freshness and coverage — 15 points

| Check | Points | How to earn it |
| --- | ---: | --- |
| Signal volume | 8 | 10+ signals captured in the last 30 days |
| Segments | 4 | 3+ customer segments (2 gets half) |
| Memo freshness | 3 | Primary memo is 7 days old or newer |

### Loop closure — 20 points

| Check | Points | How to earn it |
| --- | ---: | --- |
| Signal-linked experiments | 8 | Every experiment cites at least one signal |
| Closed experiments | 6 | Each experiment with a decision and learning earns 2, up to 6 |
| Learnings | 6 | Each learning file in the last 30 days earns 2, up to 6 |

### Agent operations — 15 points

| Check | Points | How to earn it |
| --- | ---: | --- |
| Job coverage | 6 | All six job specs exist |
| Human approval | 5 | Every job requires approval |
| Recent runs | 4 | At least one compiled/run task in the last 14 days |

### Memo quality — 10 points

| Check | Points | How to earn it |
| --- | ---: | --- |
| Specificity | 4 | Claims contain a number, date, or verbatim phrase |
| Claim limit | 3 | 3–7 claims |
| Next test | 3 | Memo body references an `exp_...` ID |

### Proof and cockpit — 10 points

| Check | Points | How to earn it |
| --- | ---: | --- |
| Fresh cockpit | 5 | Cockpit generated within 7 days |
| Public numbers | 5 | `PROOF.md` has 3+ receipt IDs and real numbers |

## Certification

A repo is **certified** when:

- it is not synthetic (synthetic share ≤ 50%);
- it has at least `score.min_signals` active signals (default 20);
- at least 50% of signals are public;
- the primary memo passes validation.

Synthetic demos are labeled `growthOS demo` and are never certified.

## Caps

A non-synthetic repo with fewer than 20 active signals is capped at 60 points. This prevents a tiny repo from looking mature.

## Determinism

The score reads files. Two runs on the same files produce the same points. File mtimes matter only for freshness checks. `generatedAt` changes, but the points do not.

## What the score does not measure

- Revenue impact.
- Whether the customer is representative.
- Whether the experiment design is good.
- Whether the memo is persuasive.

Those require judgment. The score makes the inputs to judgment visible.

## Gaming

The obvious attacks and why they fail:

| Attack | Why it fails |
| --- | --- |
| Invent signals | Every signal needs a URL or evidence block; public memos are human-reviewed |
| Cite one signal five times | Receipt count does not award points; source diversity and claim coverage do |
| Stuff claims | Claim limit and duplicate-claim checks |
| Close experiments without data | CLI refuses without a receipted result |
| Mark synthetic as public | Provenance is explicit and audited; synthetic share labels the repo |
| Regenerate the cockpit only | Freshness reads signal and memo timestamps, not the cockpit alone |
| Buy stars | `PROOF.md` requires receipt IDs and real numbers, not vanity metrics |

The score is a guardrail, not a leaderboard. If you optimize the number without changing behavior, you will hit a cap or a refusal.
