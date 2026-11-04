---
schema: "growthos/experiment@1"
id: "exp_01M6MBR8528B3P329NPREQ1J5B"
status: "complete"
hypothesis: "A no-show calculator lead magnet will produce 25 email captures in 14 days."
signal_ids:
  - "sig_01M6MBR84R5C23045ABX0VET25"
  - "sig_01M6MBR84X6GT04M6MQM6CAD1R"
  - "sig_01M6MBR84YBZR6V2FB0KEYGKK6"
channel: "lead_magnet"
audience: "ops-manager"
owner: "human"
start_at: "2026-11-05T16:00:00Z"
end_at: "2026-11-19T16:00:00Z"
primary_metric:
  name: "email_captures"
  baseline: 0
  target: 25
  observed: 9
guardrails:
  - "no_fake_scarcity"
  - "human_follow_up_only"
decision: "iterate"
learning: "The calculator was interesting but not urgent. Ops managers downloaded it and did nothing. The recovery audit produced calls; the calculator produced emails."
---

## Design

A no-show calculator lead magnet will produce 25 email captures in 14 days.

## Asset

See `asset.md`.

## Results

| Date | Metric | Value | Receipt |
| --- | --- | --- | --- |
| 2026-11-19 | email_captures | 9 | growth/metrics/2026-11-05.json |
