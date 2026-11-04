---
schema: "growthos/experiment@1"
id: "exp_01M6MBR852Q2ZKTT18Z2P29C1C"
status: "complete"
hypothesis: "A missed-call recovery landing page will produce 8 qualified demo requests in 14 days."
signal_ids:
  - "sig_01M6MBR84KRGF61N8MSPXGR900"
  - "sig_01M6MBR84TRBD1JXP1SQ43E9SC"
  - "sig_01M6MBR84W8DKZDPDCHRZ4PC59"
channel: "landing_page"
audience: "hvac-owner-operator"
owner: "human"
start_at: "2026-11-05T16:00:00Z"
end_at: "2026-11-19T16:00:00Z"
primary_metric:
  name: "qualified_demo_requests"
  baseline: 0
  target: 8
  observed: 11
guardrails:
  - "no_fake_scarcity"
  - "human_follow_up_only"
decision: "scale"
learning: "Recovery framing beat 'more leads' by 2.4x. The winning headline named the lost job, not the software."
---

## Design

A missed-call recovery landing page will produce 8 qualified demo requests in 14 days.

## Asset

See `asset.md`.

## Results

| Date | Metric | Value | Receipt |
| --- | --- | --- | --- |
| 2026-11-19 | qualified_demo_requests | 11 | growth/metrics/2026-11-05.json |
