---
schema: growthos/job@1
id: job_founder-content
name: Founder Content Engine
version: 1
enabled: true
data_sources:
  - kind: signal_glob
    path: growth/signals/**/*.md
    filters:
      status: active
  - kind: file_glob
    path: growth/memos/**/*.md
schedule: "0 9 * * 1,3,5"
filters:
  since: 14d
  min_signals: 3
outputs:
  - path: growth/content/drafts/{{date}}-founder-content.md
    schema: growthos/content@1
quality_bar:
  min_receipts_per_claim: 1
  require_verbatim_quote: true
  require_source_url: true
  min_source_diversity: 1
  max_claims: 5
human_approval: true
success_metric: "qualified replies and profile visits attributed to published content"
write_back:
  learnings: growth/learnings/
  rejected: growth/content/rejected/
---

## Job description

Turn one receipt-backed insight into a founder post, a short video script, a landing-page line, and one outbound angle. Every asset must trace back to a signal and to the founder's actual voice in `growth/voice.md`.

## What good looks like

- One idea per asset.
- The first line earns the second.
- Use the customer's words, not marketing adjectives.
- No "in today's fast-paced world."

## Output contract

A markdown file with one section per asset. Each section ends with `Receipts: [@sig_...]`.
