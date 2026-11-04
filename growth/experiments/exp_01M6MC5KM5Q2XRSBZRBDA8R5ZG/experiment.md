---
schema: "growthos/experiment@1"
id: "exp_01M6MC5KM5Q2XRSBZRBDA8R5ZG"
status: "proposed"
hypothesis: "A technical Show HN post about evidence enforcement will produce 300 GitHub stars and 1,000 npm installs in 7 days."
signal_ids:
  - "sig_01M6MC5ASE1WFDVMQGNMHCHPK1"
  - "sig_01M6MC5ASNXA2JSTJ7V0V0WN5S"
  - "sig_01M6MC5KK40Q9X8NGFRY1Y8MMX"
channel: "show-hn"
audience: "engineers and founders who run marketing themselves"
owner: "human"
start_at: "2026-11-04T22:51:41.573Z"
primary_metric:
  name: "github_stars"
  baseline: 0
  target: 300
  observed: null
guardrails:
  - "npm installs >= 300"
  - "no growth-hack language in the post"
decision: null
learning: null
---

## Design

A technical Show HN post about evidence enforcement will produce 300 GitHub stars and 1,000 npm installs in 7 days.

- Channel: show-hn
- Audience: engineers and founders who run marketing themselves
- Guardrails: npm installs >= 300, no growth-hack language in the post

## Asset

See `asset.md`.

## Results

| Date | Metric | Value | Receipt |
| --- | --- | --- | --- |
