---
schema: "growthos/experiment@1"
id: "exp_01M6MBR852YGFQSS79DDGYVF9W"
status: "running"
hypothesis: "A founder video about the $48k missed call will produce 10 qualified replies on X."
signal_ids:
  - "sig_01M6MBR84Q83CJ39CGFFSN29K7"
  - "sig_01M6MBR84XTBPTEQ1PMHEFTM7R"
channel: "x_video"
audience: "hvac-owner-operator"
owner: "human"
start_at: "2026-11-05T16:00:00Z"
end_at: "2026-11-19T16:00:00Z"
primary_metric:
  name: "qualified_replies"
  baseline: 0
  target: 10
  observed: 4
guardrails:
  - "no_fake_scarcity"
  - "human_follow_up_only"
decision: null
learning: null
---

## Design

A founder video about the $48k missed call will produce 10 qualified replies on X.

## Asset

See `asset.md`.

## Results

| Date | Metric | Value | Receipt |
| --- | --- | --- | --- |
| 2026-11-05 | qualified_replies | 4 | https://example.com/demo/summit-air/x-video |
