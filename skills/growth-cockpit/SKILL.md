---
name: growthos-growth-cockpit
description: Review the growth system weekly, explain the Growth OS Score, and choose the next test. Use for weekly reviews, score diagnostics, cockpit generation, and "what should we do next" questions.
---

# Growth Cockpit

The cockpit is a static, self-contained HTML page plus a deterministic score. It answers three questions: **What do we know? What did we learn? What do we test next?**

## Weekly review

1. Regenerate:

```bash
npx growthos cockpit --no-open
npx growthos score --explain
```

2. Read the score by dimension, not by total:

| Dimension | Question it answers |
| --- | --- |
| Evidence integrity (30) | Can we trust what we claim? |
| Freshness and coverage (15) | Are we still listening, across channels? |
| Loop closure (20) | Do experiments end in decisions and learnings? |
| Agent operations (15) | Are the jobs defined and actually run? |
| Memo quality (10) | Are memos specific, diverse, and honest? |
| Proof and cockpit (10) | Can an outsider verify us? |

3. Do not optimize the total. Fix the lowest dimension that reflects a real behavior.
4. Pick one next test from the memo's "What to test next" section.
5. Write the weekly note in `growth/cockpit/YYYY-MM-DD-weekly.md`.

## Weekly note contract

```markdown
# Week of 2026-11-02

## Score
- 81 → 88 (System). Evidence +4, loop closure +3.

## What changed
- 9 new signals from 3 channels; 1 new published memo.
- EXP-002 closed: iterate.

## What we learned
- <one sentence with a receipt>

## What we are not saying
- <the honest gap in the evidence>

## Next test
- <hypothesis, metric, target, window>
```

## Score integrity

The score is deterministic and auditable. Do not game it:

- Do not add signals that do not exist.
- Do not cite the same signal five times to raise receipt counts.
- Do not mark a synthetic demo as certified.
- Do not close an experiment without a receipted result.
- Do not regenerate the cockpit just to reset the freshness clock; the score reads file timestamps.

If a dimension is low, say why in plain language. A 62 with a clear reason is more useful than an 88 you cannot explain.

## Report to the user

Give:

1. the total and tier;
2. the biggest real gap;
3. one change that would close it;
4. the next test.
