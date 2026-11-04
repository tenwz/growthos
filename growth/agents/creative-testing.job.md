---
schema: growthos/job@1
id: job_creative-testing
name: Creative Testing Engine
version: 1
enabled: true
data_sources:
  - kind: signal_glob
    path: growth/signals/**/*.md
    filters:
      status: active
  - kind: metric_glob
    path: growth/metrics/**/*.json
schedule: "0 10 * * 2"
filters:
  since: 30d
  min_signals: 5
outputs:
  - path: growth/experiments/{{date}}-creative-proposal.md
    schema: growthos/experiment@1
quality_bar:
  min_receipts_per_claim: 1
  require_verbatim_quote: true
  require_source_url: true
  min_source_diversity: 1
  max_claims: 10
human_approval: true
success_metric: "primary conversion metric versus baseline, with a decision"
write_back:
  learnings: growth/learnings/
  rejected: growth/experiments/rejected/
---

## Job description

Turn a receipt-backed claim into a testable hypothesis. One offer, many angles. Record what won and what lost, then write the learning back into the repo.

## Output contract

For each proposed test: hypothesis, signal IDs, audience, channel, primary metric with baseline and target, guardrails, and the asset needed.

## Hard rules

- A hypothesis must be falsifiable and time-bound.
- One primary metric per experiment.
- No fake scarcity, fake testimonials, or misleading claims.
- Kill losing tests quickly and write down why.
