---
name: growthos-creative-testing
description: Design, run, and close creative experiments with receipts. Use for landing-page tests, ad creative, lead magnets, pricing-page changes, and deciding scale/iterate/kill from real numbers.
---

# Creative Testing

A test is a bet on a mechanism. If you cannot name the mechanism, it is content, not an experiment.

## Design

Start from a claim in the latest memo. Then fill all seven fields:

```text
Hypothesis: <change> will produce <metric> from <baseline> to <target> in <window>, because <mechanism>.
Primary metric: one number.
Baseline: measured, not remembered.
Target: a number that would change a decision.
Guardrail: what must not get worse.
Audience: who sees it.
Receipt: where the result will come from.
```

Create it:

```bash
npx growthos experiment new \
  --hypothesis "A missed-call calculator on the pricing page will produce 25 email captures in 14 days because owners cannot estimate the loss themselves." \
  --channel landing-page \
  --metric email_captures \
  --signal sig_... \
  --baseline 6 \
  --target 25 \
  --guardrail "demo-request rate >= 2%"
```

Rules:

- One primary metric. Everything else is a guardrail or an observation.
- No "engagement" as a primary metric unless engagement is the product.
- Never change the creative and the audience and the offer at once. One variable.
- Write down the kill condition before the result arrives.

## Run

- Link the asset in `asset.md`.
- Log every result with a receipt — a screenshot, a metrics JSON, an analytics URL:

```bash
npx growthos experiment log <exp_id> --metric email_captures --value 9 --source growth/metrics/2026-w46.json
```

- Log the result even when it is bad. Failed experiments are the most valuable rows in the ledger.

## Decide

The CLI refuses to close an experiment without a receipted result. That is intentional.

```bash
npx growthos experiment decide <exp_id> --decision iterate --learning "..."
```

Decision definitions:

- **scale** — target hit or exceeded, guardrail held. Roll it out and raise the target.
- **iterate** — direction unclear or one element confounded. Change one thing and rerun.
- **kill** — target missed with enough sample, or guardrail broke. Stop spending.
- **inconclusive** — sample too small, tracking broken, or the test did not run as designed.

The learning must be a sentence someone can act on, not "it didn't work." Example: "Owners do not want to calculate the loss; they want us to tell them the number. The calculator added friction. Replace it with a one-field 'calls per week' estimate."

## Output to the user

Report the hypothesis, observed value, decision, and the single change the learning implies. Then name the next test.
