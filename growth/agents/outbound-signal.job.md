---
schema: growthos/job@1
id: job_outbound-signal
name: Outbound Signal Engine
version: 1
enabled: true
data_sources:
  - kind: signal_glob
    path: growth/signals/**/*.md
    filters:
      status: active
      provenance: [public, internal]
schedule: manual
filters:
  since: 14d
  min_signals: 3
outputs:
  - path: growth/outbound/{{date}}-account-list.md
    schema: growthos/outbound@1
quality_bar:
  min_receipts_per_claim: 1
  require_verbatim_quote: true
  require_source_url: true
  min_source_diversity: 1
  max_claims: 20
human_approval: true
success_metric: "positive replies from qualified accounts, not messages sent"
write_back:
  learnings: growth/learnings/
  rejected: growth/outbound/rejected/
---

## Job description

Good outbound starts with timing, not a spreadsheet. Surface accounts with a real reason to care this week: funding, hiring for the problem you solve, a new location, a public complaint, or a bad review.

## Output contract

For each account: company, person, trigger, receipt, one specific first line, one reason to reply, and the risk of being wrong.

## Hard rules

- Never send. Draft only.
- Never invent a trigger or a person.
- Never write a first line that could apply to any company.
- If you cannot find a trigger, say "no trigger" and exclude the account.
- Respect platform terms and anti-spam law.
