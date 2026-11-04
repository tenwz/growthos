# 快速开始

五分钟内，从零得到一个能拒绝糟糕营销结论的仓库。

## 环境

- Node.js 20+
- 终端
- 可选：Claude Code、Codex、Cursor 或任何 MCP 客户端
- 可选：API Key（只有 `task run` 需要调用模型）

## 1. 运行 demo

```bash
npx growthos demo
```

你会看到一家虚构的暖通 SaaS 公司 Summit Air。一份 memo 通过，另一份草稿失败，因为它声称「HVAC 老板想要 AI SDR」却没有收据。Cockpit 会自动在浏览器打开。

Demo 在当前目录创建 `growthos-demo/`，随时可以删除。

## 2. 创建自己的仓库

```bash
npx growthos init my-growth-os --agent all
cd my-growth-os
```

参数：

- `--template base`（默认）或 `--template hvac-saas`
- `--agent all | claude-code | codex | cursor | none`
- `--force` 覆盖非空目录

生成的目录：

```text
.growthos/config.yaml
growth/
  signals/ memos/ experiments/ agents/ cockpit/ content/ outbound/ ai-search/
  company.md icp.md voice.md README.md
AGENTS.md
CLAUDE.md
```

## 3. 采集第一条信号

一条信号 = 一个来源里的一句**原话**。不要总结，不要润色。

公开帖子：

```bash
npx growthos capture \
  --source x_post \
  --url "https://x.com/acme/status/123" \
  --quote "We tried an AI SDR for a month. It booked 3 meetings and 2 were with other AI companies." \
  --segment agency-owner \
  --tags ai-sdr,lead-quality
```

客户通话（私有）：

```bash
npx growthos capture \
  --source call \
  --quote "I know we miss calls. I just can't hire another person right now." \
  --summary "老板知道损失，但卡在招聘上。" \
  --segment owner-operator \
  --provenance internal \
  --consent anonymized
```

查看状态：

```bash
npx growthos status
```

## 4. 编译每周 memo 任务

```bash
npx growthos task compile job_customer-truth --since 7d
```

输出：

```text
✓ Compiled job_customer-truth
  run       .growthos/runs/run_01...
  signals   9
  prompt    .growthos/runs/run_01.../prompt.md
  output    growth/memos/2026-11-06-whatthemarketistellingus.md
```

把 `prompt.md` 贴进你的 Agent，或者直接运行：

```bash
npx growthos task run job_customer-truth --apply
```

`--apply` 会把输出写进仓库，并拒绝覆盖已发布的 memo。不加 `--apply` 时，草稿只留在 run 目录里供你检查。

## 5. 验证

```bash
npx growthos doctor --strict
```

通过：

```text
✓ No evidence errors. No warnings.
```

失败：

```text
FAIL  Claim 2 has no receipt. Add [@sig_...] or remove the claim.  growth/memos/draft.md:9
```

改 memo，不要改 linter。

## 6. 做一个实验

```bash
npx growthos experiment new \
  --hypothesis "A missed-call calculator will produce 25 email captures in 14 days because owners cannot estimate the loss themselves." \
  --channel landing-page \
  --metric email_captures \
  --signal sig_01... \
  --baseline 6 \
  --target 25 \
  --guardrail "demo-request rate >= 2%"
```

有结果后：

```bash
npx growthos experiment log exp_01... \
  --metric email_captures \
  --value 9 \
  --source growth/metrics/2026-w46.json
```

关闭实验：

```bash
npx growthos experiment decide exp_01... \
  --decision iterate \
  --learning "Owners want us to tell them the number. The calculator added friction."
```

## 7. 生成 cockpit

```bash
npx growthos cockpit --no-open
npx growthos score --explain
```

如果想让外部看到，把 `growth/cockpit/` 提交到仓库。HTML 不包含任何外部请求。

## 8. 放进 CI

```yaml
name: growth
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: tenwz/growthos@v0.1
        with:
          strict: true
          min-score: 60
```

## 常见问题

**提示 "No growthOS repo found"**
在仓库内运行，或传 `--root <path>`。

**提示 "Public signals need a URL"**
私有笔记用 `--provenance internal`，或者补 `--url`。

**缺少 `## Receipts` 表**
运行 `npx growthos task run <job> --apply`。这张表由工具生成，不要手写。

**哈希校验失败**
采集后原话或 URL 被改过。采集一条新信号并设置 `supersedes`，不要修改历史。

**分数被限制在 60**
活跃信号少于 20 条。补充证据，不要为了分数降低 `score.min_signals`。
