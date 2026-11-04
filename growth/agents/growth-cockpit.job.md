---
schema: growthos/job@1
id: job_growth-cockpit
name: Growth Cockpit
version: 1
enabled: true
data_sources:
  - kind: metric_glob
    path: growth/metrics/**/*.json
  - kind: file_glob
    path: growth/experiments/**/*.md
  - kind: file_glob
    path: growth/memos/**/*.md
schedule: "0 17 * * 5"
filters:
  since: 14d
  min_signals: 0
outputs:
  - path: growth/cockpit/weekly-report.md
    schema: growthos/cockpit@1
quality_bar:
  min_receipts_per_claim: 1
  require_verbatim_quote: false
  require_source_url: true
  min_source_diversity: 1
  max_claims: 10
human_approval: true
success_metric: "decisions made from the weekly cockpit, not reports shipped"
write_back:
  learnings: growth/learnings/
  rejected: growth/cockpit/rejected/
---

## Job description

Produce the weekly view: what changed, what worked, which experiment won or lost, which objection repeated, and what to test next. Every number needs a receipt.

## Output contract

Five sections: What changed / What worked / What failed / What to test next / One ask.

## Hard rules

- Report failures, not only wins.
- Do not count activity as results. Messages sent is not a result. Qualified replies is.
- If a metric has no receipt, write "unverified" next to it.
