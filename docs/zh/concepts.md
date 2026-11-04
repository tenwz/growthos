# 核心概念

## 仓库就是记忆

普通营销工具把数据存在你读不到的 SaaS 数据库里。Growth OS 把数据存在一个你能用编辑器打开、能在 PR 里 diff、能交给 Agent 的文件夹里。

纯文本不是限制，而是接口：每个 Agent 本来就会读写文件。

## Signal（信号）

一条信号 = 客户说过或做过的一件事，包含：

- 逐字原话（或事件数/指标证据块）；
- 来源类型和 URL；
- 来自谁（segment，可选 author）；
- 采集时间和发布时间；
- consent 与 provenance；
- 原话 + 规范 URL + 发布时间的 SHA-256 哈希。

信号只追加，不修改。原话错了就采集一条新信号，用 `supersedes` 指向旧信号，并把旧信号标记为 `superseded`。

为什么需要哈希？因为 AI 营销最常见的失败，是一句原话在多次转述中慢慢变成「更好用」的版本。哈希让这种漂移可见。

## Receipt（收据）

收据是 `[@sig_...]` 引用，把结论连接到信号。没有收据的结论不是结论，是意见。

收据检查成本极低，大规模造假成本极高。它也让几个月后的读者能直接回到来源。

## Memo

Memo 是一小组关于「市场在告诉我们什么」的具体结论，每条都带收据。好 memo 的特征：

- 4–7 条结论；
- 多个渠道；
- 有「What we are not saying」（我们没在说什么）；
- 有反证；
- 有下一步测试。

已发布的 memo 不可修改。有新证据就写一份 supersede 旧 memo 的新 memo。

## Experiment（实验）

实验把假设、动机信号、渠道、一个主指标和护栏绑定在一起。

状态有四种：`proposed`、`running`、`complete`、`abandoned`。每一行结果都必须有收据。只有带决策（`scale`、`iterate`、`kill`、`inconclusive`）和书面学习的实验才能关闭。

「没有收据不能关闭」是刻意设计。它把「我们试过了」变成可审计的记录。

## Learning（学习）

学习文件保存在 `growth/learnings/<exp_id>.md`。它说明结果意味着什么、下一步改什么。独立于实验，方便被引用、统计和评分。

## Job

Job 是 `growth/agents/*.job.md` 里的可复用 Agent 任务规范，声明：

- 数据源；
- 频率；
- 过滤器；
- 输出；
- 质量门槛（每条结论的收据数、逐字原话、来源 URL、来源多样性）；
- 是否需要人工审批；
- 成功指标；
- 写回位置。

CLI 把 job 编译成 prompt、上下文、输出 schema 和 manifest。Agent 不能自己发明质量门槛。

## Prompt compiler

`task compile` 按时间、segment、tag 选择信号，按哈希去重，限制数量，并把每条信号包进 `<untrusted_signal>`。这是安全边界：客户文本里可能藏指令，那些指令只是数据，不是命令。

## Provider

Provider 负责调用模型。v0.1 有两个：

- `command`：把 prompt 通过 stdin 传给 `claude -p`、`codex exec`、`ollama run` 或任何本地命令，读 stdout。growthOS 不处理 API Key。
- `openai-compatible`：调用任意 `/chat/completions` 端点。

你也可以完全不用 provider，手动把 `prompt.md` 贴进 Agent。

## Cockpit

Cockpit 是一个自包含 HTML + `badge.json` + `badge.svg` + `share-card.svg`。它从仓库生成，不由服务器渲染。可以提交到仓库并用 GitHub Pages 托管。

## Score

Growth OS Score 是 100 分的确定性系统健康度评分。它不衡量收入，也不是虚荣指标。它奖励证据覆盖率、新鲜度、闭环、job 完整性、memo 质量和公开证明。

合成仓库会被标记且不能认证。评分读取文件时间戳，所以只重新生成 cockpit 不能重置新鲜度。

## 同意与来源

| Provenance | 含义 | 是否必须公开 URL |
| --- | --- | --- |
| `public` | 任何人都能看来源 | 是 |
| `internal` | 私有通话、工单或笔记 | 否 |
| `synthetic` | Demo 数据 | 否；不能支撑已发布 memo |

| Consent | 含义 |
| --- | --- |
| `public` | 来源公开 |
| `internal` | 私有，可内部使用 |
| `anonymized` | 私有，已移除姓名和标识 |

不确定时，匿名化并使用 `internal`。一份带脱敏原话的有用 memo，好过一场诉讼。

## growthOS 拒绝什么

- 没有收据的结论。
- 用合成数据支撑已发布 memo。
- 没有带收据结果就关闭实验。
- 不要求人工审批就发布或发送的 job。
- 提交进仓库的密钥。
- 藏在客户文本里的指令。

这些「拒绝」才是产品。其他都是管道。
