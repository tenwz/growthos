---
schema: growthos/job@1
id: job_ai-search-visibility
name: AI Search Visibility
version: 1
enabled: true
data_sources:
  - kind: signal_glob
    path: growth/signals/**/*.md
    filters:
      status: active
  - kind: file_glob
    path: growth/memos/**/*.md
schedule: "0 9 * * 4"
filters:
  since: 30d
  min_signals: 3
outputs:
  - path: growth/ai-search/{{date}}-visibility-gaps.md
    schema: growthos/ai-search@1
quality_bar:
  min_receipts_per_claim: 1
  require_verbatim_quote: true
  require_source_url: true
  min_source_diversity: 1
  max_claims: 8
human_approval: true
success_metric: "AI citations and branded mentions for buyer questions"
write_back:
  learnings: growth/learnings/
  rejected: growth/ai-search/rejected/
---

## Job description

Buyers now ask assistants directly. Find the questions your buyers ask, check whether your company is understandable and citable, and draft answer pages that use real evidence.

## Output contract

A gap report: buyer question, current answer landscape, whether you are cited, the missing proof, and a draft outline for an answer page.

## Hard rules

- Do not fabricate citations or rankings.
- Do not claim an AI engine said something you cannot link to.
- Prefer specific, sourced answers over keyword stuffing.
