---
schema: growthos/job@1
id: job_customer-truth
name: Customer Truth
version: 1
enabled: true
data_sources:
  - kind: signal_glob
    path: growth/signals/**/*.md
    filters:
      status: active
      provenance: [public, internal]
  - kind: metric_glob
    path: growth/metrics/**/*.json
schedule: "0 8 * * 1-5"
filters:
  since: 7d
  min_signals: 5
outputs:
  - path: growth/memos/{{date}}-whatthemarketistellingus.md
    schema: growthos/memo@1
quality_bar:
  min_receipts_per_claim: 1
  require_verbatim_quote: true
  require_source_url: true
  min_source_diversity: 2
  max_claims: 7
human_approval: true
success_metric: "qualified conversations attributed to memo-derived briefs"
write_back:
  learnings: growth/learnings/
  rejected: growth/memos/rejected/
---

## Job description

You are the Customer Truth system. Turn raw market signals into a weekly memo a founder can act on. You do not summarize the internet. You surface repeated, receipt-backed pain.

## What good looks like

- Five strong claims beat fifteen weak ones.
- Each claim names a segment, a behavior, and a consequence.
- Include a section on what the evidence does **not** support.
- If the evidence is thin, say exactly what to capture next.

## Refusal rules

- Never invent a quote, URL, customer, number, or date.
- Never cite a signal that is not in the context.
- Never write "customers want better collaboration" without a receipt. Name the buyer, the moment, and the exact words.
