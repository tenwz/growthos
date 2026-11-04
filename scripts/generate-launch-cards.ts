import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type SignalRecord, loadRepo } from "@growthos/core";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "launch/cards");
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((value): value is string => Boolean(value));
const CHROME = CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate)) ?? "";

const CARDS: { signal: string; claim: string }[] = [
  {
    signal: "sig_01M6MC5ASKW92YAHXCFTG08MK3",
    claim: "AI-generated marketing is a trust liability.",
  },
  { signal: "sig_01M6MC5ASJV4KNN2P5T2Q33T5A", claim: "Content-led distribution is eroding." },
  { signal: "sig_01M6MC5ASNXA2JSTJ7V0V0WN5S", claim: "AI visibility is opaque by design." },
  { signal: "sig_01M6MC5KJYAYSNJV2QH4AMYA0N", claim: "11% of AI answers are unsupported." },
  { signal: "sig_01M6MC5KK40Q9X8NGFRY1Y8MMX", claim: "Enforcement is the moat, not generation." },
  {
    signal: "sig_01M6MC5KK4NPF95MMJ7BKYKEE7",
    claim: "The linter is deterministic. The agent is creative.",
  },
  { signal: "sig_01M6MC5ASE1WFDVMQGNMHCHPK1", claim: "AI outbound is saturating itself." },
  { signal: "sig_01M6MC5KK3H7Z6FEHB1FH1S7RA", claim: "Attribution is fuzzy, so consistency wins." },
  { signal: "sig_01M6MC5KK2FDV1J2QBK60QV178", claim: "Attribution is the bane of marketers." },
  { signal: "sig_01M6MC5ASMERS5J0XNXWFYHRVP", claim: "AI slop causes fatigue, not demand." },
  { signal: "sig_01M6MC5KK4H9SAFQ8VA9Y5AQRY", claim: "More skills made the agent worse." },
  {
    signal: "sig_01M6MC5ASN6MSK7XBWNX5X38A7",
    claim: "SEO strength does not predict AI visibility.",
  },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sourceLabel(url: string | undefined): string {
  if (!url) return "No public URL";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "news.ycombinator.com") return "Hacker News";
    if (host === "github.com") return "GitHub";
    if (host === "x.com" || host === "twitter.com") return "X";
    if (host === "reddit.com") return "Reddit";
    return host;
  } catch {
    return "Source";
  }
}

function quoteSize(length: number): number {
  if (length <= 80) return 68;
  if (length <= 140) return 56;
  if (length <= 200) return 48;
  if (length <= 280) return 42;
  return 37;
}

function signalOrThrow(signals: Map<string, SignalRecord>, id: string): SignalRecord {
  const signal = signals.get(id);
  if (!signal) throw new Error(`Missing launch-card signal: ${id}`);
  return signal;
}

function shell(title: string, body: string, css: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: #0b0f0d;
    color: #e8f0ea;
    -webkit-font-smoothing: antialiased;
  }
  .mono { font-family: "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace; }
  .lime { color: #4ee896; }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(78,232,150,.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(78,232,150,.055) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(circle at 70% 20%, #000 0%, transparent 75%);
  }
  ${css}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function cardHtml(card: (typeof CARDS)[number], index: number, signal: SignalRecord): string {
  const quote = signal.data.quote;
  const size = quoteSize(quote.length);
  const hash = signal.data.integrity?.quote_hash.slice(0, 12) ?? null;
  const source = sourceLabel(signal.data.source.url);
  const body = `
  <div class="card">
    <div class="grid"></div>
    <div class="index mono">${String(index + 1).padStart(2, "0")}</div>
    <header>
      <div class="brand"><span class="brand-mark">/</span> growthOS</div>
      <div class="kind mono">SIGNAL · ${escapeHtml(signal.data.source.kind.toUpperCase())}</div>
    </header>
    <div class="quote" style="font-size:${size}px">${escapeHtml(quote)}</div>
    <footer>
      <div class="claim-label mono">CLAIM</div>
      <div class="claim">${escapeHtml(card.claim)}</div>
      <div class="meta mono">
        <span>${escapeHtml(source)}</span>
        <span class="dot">·</span>
        <span>${escapeHtml(signal.data.id.slice(0, 18))}…</span>
        <span class="dot">·</span>
        ${hash ? `<span class="lime">hash ${escapeHtml(hash)}</span>` : ""}
      </div>
    </footer>
  </div>`;
  const css = `
  .card { position: relative; width: 1080px; height: 1080px; padding: 84px 88px 76px; display: flex; flex-direction: column; background:
    radial-gradient(900px 600px at 90% -10%, rgba(78,232,150,.13), transparent 60%),
    radial-gradient(700px 500px at -10% 110%, rgba(31,122,72,.25), transparent 65%),
    linear-gradient(160deg, #0e1511 0%, #0b0f0d 55%, #0a0d0b 100%); }
  header { display: flex; justify-content: space-between; align-items: baseline; position: relative; z-index: 2; }
  .brand { font-size: 34px; font-weight: 650; letter-spacing: -0.03em; }
  .brand-mark { color: #4ee896; }
  .kind { font-size: 15px; letter-spacing: .16em; color: #6d7f74; }
  .index { position: absolute; right: 70px; top: 170px; font-size: 260px; line-height: 1; color: rgba(78,232,150,.055); z-index: 0; }
  .quote { position: relative; z-index: 2; margin-top: auto; margin-bottom: auto; font-weight: 560; line-height: 1.24; letter-spacing: -0.025em; color: #f2f7f4; }
  .quote::before { content: "“"; display: block; color: #4ee896; font-size: 1.2em; line-height: .6; margin-bottom: .18em; font-family: Georgia, serif; }
  footer { position: relative; z-index: 2; border-top: 1px solid #223029; padding-top: 30px; }
  .claim-label { font-size: 14px; letter-spacing: .18em; color: #4ee896; margin-bottom: 10px; }
  .claim { font-size: 32px; font-weight: 600; letter-spacing: -0.015em; color: #cfe0d5; }
  .meta { margin-top: 18px; font-size: 15px; color: #6d7f74; display: flex; gap: 10px; flex-wrap: wrap; }
  .dot { color: #3a4a40; }`;
  return shell(`growthOS signal ${index + 1}`, body, css);
}

function xhsCoverHtml(): string {
  const body = `
  <div class="cover">
    <div class="grid"></div>
    <div class="top">
      <div class="brand"><span class="brand-mark">/</span> growthOS</div>
      <div class="tag mono">OPEN SOURCE · MIT</div>
    </div>
    <div class="main">
      <div class="eyebrow">AI 营销，缺的不是文案</div>
      <h1>营销结论<br><span class="lime">必须有出处</span></h1>
      <p class="sub">每条 claim 都要有原话、链接、日期和哈希。<br>没有出处，直接让 build 失败。</p>
      <div class="terminal mono">
        <span class="prompt">$</span> npx growthos demo
      </div>
      <div class="output mono">
        <div><span class="fail">FAIL</span> Claim 2: no receipt.</div>
        <div><span class="pass">PASS</span> 6 claims · 18 receipts</div>
      </div>
    </div>
    <div class="bottom">
      <div class="score"><span class="num">88</span><span class="den">/100</span><div class="tier mono">SYSTEM · CERTIFIED</div></div>
      <div class="note mono">WEEK 0: ALL ZEROS<br>PROOF.md</div>
    </div>
  </div>`;
  const css = `
  .cover { position: relative; width: 1242px; height: 1660px; padding: 96px 92px 92px; display: flex; flex-direction: column;
    background:
      radial-gradient(1000px 700px at 85% 0%, rgba(78,232,150,.16), transparent 62%),
      radial-gradient(800px 700px at 0% 100%, rgba(31,122,72,.28), transparent 60%),
      linear-gradient(165deg, #0f1713 0%, #0b0f0d 60%, #090c0a 100%); }
  .top { display: flex; justify-content: space-between; align-items: baseline; }
  .brand { font-size: 42px; font-weight: 650; letter-spacing: -0.03em; }
  .tag { font-size: 17px; letter-spacing: .16em; color: #6d7f74; }
  .main { margin-top: 150px; }
  .eyebrow { font-size: 30px; color: #94a39a; letter-spacing: .02em; }
  h1 { margin-top: 36px; font-size: 118px; line-height: 1.08; letter-spacing: -0.05em; font-weight: 720; color: #f2f7f4; }
  .sub { margin-top: 54px; font-size: 34px; line-height: 1.6; color: #cfe0d5; }
  .terminal { margin-top: 64px; display: inline-block; font-size: 34px; padding: 26px 36px; border: 1px solid #2c3831; border-radius: 14px; background: rgba(7,19,12,.72); color: #e8f0ea; }
  .prompt { color: #4ee896; margin-right: 12px; }
  .output { margin-top: 34px; font-size: 25px; line-height: 1.9; color: #94a39a; }
  .fail { color: #ff7b72; font-weight: 700; }
  .pass { color: #4ee896; font-weight: 700; }
  .bottom { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #223029; padding-top: 44px; }
  .score { display: flex; align-items: baseline; gap: 6px; }
  .num { font-size: 92px; font-weight: 700; letter-spacing: -0.05em; color: #4ee896; }
  .den { font-size: 40px; color: #6d7f74; }
  .tier { font-size: 15px; letter-spacing: .14em; color: #94a39a; margin-top: 10px; }
  .note { font-size: 15px; line-height: 1.7; letter-spacing: .08em; color: #6d7f74; text-align: right; }`;
  return shell("growthOS — 营销结论必须有出处", body, css);
}

const XHS_BASE = `
  .slide { position: relative; width: 1242px; height: 1660px; padding: 92px 92px 78px; display: flex; flex-direction: column;
    background:
      radial-gradient(900px 700px at 88% -5%, rgba(78,232,150,.12), transparent 62%),
      radial-gradient(800px 700px at -5% 105%, rgba(31,122,72,.24), transparent 60%),
      linear-gradient(165deg, #0f1713 0%, #0b0f0d 60%, #090c0a 100%); }
  .shead { display: flex; justify-content: space-between; align-items: baseline; position: relative; z-index: 2; }
  .brand { font-size: 40px; font-weight: 650; letter-spacing: -0.03em; }
  .brand-mark { color: #4ee896; }
  .snum { font-size: 20px; letter-spacing: .16em; color: #6d7f74; }
  .smain { position: relative; z-index: 2; margin-top: 128px; }
  .eyebrow { font-size: 21px; letter-spacing: .22em; color: #4ee896; }
  h2 { margin-top: 26px; font-size: 88px; line-height: 1.14; letter-spacing: -0.045em; font-weight: 720; color: #f2f7f4; }
  h2 .lime { color: #4ee896; }
  .pull { margin-top: 64px; font-size: 33px; line-height: 1.62; color: #94a39a; }
  .sfoot { margin-top: auto; display: flex; justify-content: space-between; border-top: 1px solid #223029; padding-top: 30px; font-size: 18px; letter-spacing: .08em; color: #6d7f74; }
  .lime { color: #4ee896; }
  .fail { color: #ff7b72; font-weight: 700; }
  .pass { color: #4ee896; font-weight: 700; }
  code { font-family: "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace; font-size: .92em; color: #e8f0ea; }
`;

function xhsSlide(
  num: number,
  eyebrow: string,
  title: string,
  content: string,
  note: string,
  extra: string,
): string {
  const body = `
  <div class="slide">
    <div class="grid"></div>
    <div class="shead">
      <div class="brand"><span class="brand-mark">/</span> growthOS</div>
      <div class="snum mono">${String(num).padStart(2, "0")} / 08</div>
    </div>
    <div class="smain">
      <div class="eyebrow mono">${eyebrow}</div>
      <h2>${title}</h2>
      ${content}
    </div>
    <div class="sfoot mono"><span>npx growthos demo</span><span>${note}</span></div>
  </div>`;
  return shell(`growthOS — ${eyebrow}`, body, XHS_BASE + extra);
}

function xhsProblemHtml(): string {
  const content = `
    <div class="rows">
      <div class="row"><div class="q">客户上周说了什么？</div><div class="a">散在聊天记录、录音和工单里。</div></div>
      <div class="row"><div class="q">哪个渠道真的有效？</div><div class="a">散在三个后台，口径还不一样。</div></div>
      <div class="row"><div class="q">上次实验为什么失败？</div><div class="a">没人记得，也没人写下来。</div></div>
    </div>
    <p class="pull">于是 AI 只能编一个<br>听起来合理的故事。</p>`;
  const extra = `
    .rows { margin-top: 92px; }
    .row { padding: 44px 0; border-bottom: 1px solid #223029; }
    .row:first-child { border-top: 1px solid #223029; }
    .q { font-size: 46px; font-weight: 600; letter-spacing: -0.02em; color: #e8f0ea; }
    .a { margin-top: 16px; font-size: 30px; color: #94a39a; }`;
  return xhsSlide(
    2,
    "THE PROBLEM",
    "AI 很会写，<br>但公司没有记忆",
    content,
    "起点不是 prompt",
    extra,
  );
}

function xhsDemoHtml(): string {
  const content = `
    <div class="term mono">
      <div class="cmd"><span class="prompt">$</span> npx growthos demo</div>
      <div class="gap"></div>
      <div><span class="fail">FAIL</span> Claim 2: "HVAC owners want an AI SDR."</div>
      <div class="indent">Claim 2 has no receipt.</div>
      <div class="indent">Add [@sig_...] or remove the claim.</div>
      <div class="gap"></div>
      <div><span class="pass">PASS</span> 6 claims · 18 receipts · 4 channels</div>
    </div>
    <p class="pull">另一份 memo 通过了，<br>因为每一句都能追到原话。</p>`;
  const extra = `
    .term { margin-top: 78px; padding: 50px 44px; border: 1px solid #2c3831; border-radius: 16px;
      background: rgba(7,19,12,.8); font-size: 25px; line-height: 1.85; color: #cfe0d5; }
    .cmd { color: #f2f7f4; }
    .prompt { color: #4ee896; margin-right: 10px; }
    .indent { padding-left: 72px; color: #94a39a; }
    .gap { height: 26px; }`;
  return xhsSlide(3, "THE DEMO", "一句话，<br>让 build 失败", content, "失败是功能", extra);
}

function xhsMechanismHtml(): string {
  const content = `
    <ol class="steps">
      <li><span class="num mono">01</span><div><div class="st">记录信号</div><div class="sd">原话 + 链接 + 日期 + 授权</div></div></li>
      <li><span class="num mono">02</span><div><div class="st">计算哈希</div><div class="sd">原话被改过，审计会发现</div></div></li>
      <li><span class="num mono">03</span><div><div class="st">写 memo</div><div class="sd">每条结论必须引用 [@sig_...]</div></div></li>
      <li><span class="num mono">04</span><div><div class="st">跑检查</div><div class="sd">引用、哈希、状态、撤回，逐条验证</div></div></li>
    </ol>
    <div class="callout">证据链里没有 LLM。<br><span class="lime">模型负责写，审计负责拒绝。</span></div>`;
  const extra = `
    .steps { margin-top: 74px; list-style: none; }
    .steps li { display: flex; gap: 34px; padding: 34px 0; border-bottom: 1px solid #223029; }
    .steps li:first-child { border-top: 1px solid #223029; }
    .num { font-size: 22px; color: #4ee896; letter-spacing: .1em; padding-top: 10px; }
    .st { font-size: 42px; font-weight: 600; letter-spacing: -0.02em; }
    .sd { margin-top: 12px; font-size: 28px; color: #94a39a; }
    .callout { margin-top: 58px; padding: 40px 44px; border-left: 3px solid #4ee896; background: rgba(78,232,150,.055);
      font-size: 33px; line-height: 1.55; color: #cfe0d5; }`;
  return xhsSlide(4, "THE MECHANISM", "每条结论，<br>都要带收据", content, "确定性，可复现", extra);
}

function xhsStructureHtml(): string {
  const content = `
    <pre class="tree mono"><span class="lime">growth/</span>
  signals/      原话和来源
  memos/        带收据的结论
  experiments/  假设 → 数据 → 决策
  agents/       给 agent 的任务说明
  cockpit/      一张离线仪表盘</pre>
    <p class="pull">纯 Markdown + YAML。<br>Claude Code、Codex、Cursor 都能直接读。</p>`;
  const extra = `
    .tree { margin-top: 82px; padding: 48px 44px; border: 1px solid #2c3831; border-radius: 16px;
      background: rgba(7,19,12,.8); font-size: 28px; line-height: 2; color: #cfe0d5; white-space: pre; }`;
  return xhsSlide(
    5,
    "THE STRUCTURE",
    "五个文件夹，<br>就是一个 Growth OS",
    content,
    "文件即接口",
    extra,
  );
}

function xhsScoreHtml(): string {
  const bars = [
    ["证据", 30, 100],
    ["新鲜度", 15, 50],
    ["实验闭环", 20, 67],
    ["Agent 运行", 15, 50],
    ["Memo 质量", 10, 33],
    ["证明", 10, 33],
  ];
  const content = `
    <div class="bars">
      ${bars
        .map(
          ([label, points, width]) => `
        <div class="bar">
          <div class="bl"><span>${label}</span><span class="mono">${points}</span></div>
          <div class="track"><div class="fill" style="width:${width}%"></div></div>
        </div>`,
        )
        .join("")}
    </div>
    <div class="caps">
      <div>少于 20 条信号 <span class="mono">→</span> 最高 60 分</div>
      <div>合成数据 <span class="mono">→</span> 不能认证</div>
    </div>
    <p class="pull">示例仓库 <span class="lime">88/100</span> · 自己的仓库 <span class="lime">82/100</span></p>`;
  const extra = `
    .bars { margin-top: 66px; display: grid; gap: 28px; }
    .bl { display: flex; justify-content: space-between; font-size: 30px; color: #cfe0d5; margin-bottom: 12px; }
    .track { height: 12px; border-radius: 99px; background: #16201a; overflow: hidden; }
    .fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #1f7a48, #4ee896); }
    .caps { margin-top: 48px; padding: 30px 36px; border: 1px solid #2c3831; border-radius: 14px;
      background: rgba(7,19,12,.6); font-size: 26px; line-height: 1.9; color: #94a39a; }`;
  return xhsSlide(6, "THE SCORE", "100 分，<br>不靠感觉", content, "公开评分规则", extra);
}

function xhsAgentHtml(): string {
  const content = `
    <div class="features">
      <div class="feature"><div class="fk mono">PROVIDER</div><div class="fv"><code>claude -p</code> / <code>codex exec</code> / Ollama</div><div class="fd">不需要 API key，provider 就是一条命令。</div></div>
      <div class="feature"><div class="fk mono">MCP SERVER</div><div class="fv">读工具开放，写工具默认 dry-run</div><div class="fd">捕获信号、建实验、结案都需要明确批准。</div></div>
      <div class="feature"><div class="fk mono">COMPLEMENTS</div><div class="fv">marketingskills 教怎么写</div><div class="fd">growthOS 负责记住、引用和验证。</div></div>
    </div>
    <p class="pull">没有 API key 也能跑。<br>没有 agent 也能用。</p>`;
  const extra = `
    .features { margin-top: 74px; }
    .feature { padding: 36px 0; border-bottom: 1px solid #223029; }
    .feature:first-child { border-top: 1px solid #223029; }
    .fk { font-size: 19px; letter-spacing: .18em; color: #4ee896; }
    .fv { margin-top: 14px; font-size: 38px; font-weight: 600; letter-spacing: -0.02em; color: #e8f0ea; }
    .fd { margin-top: 12px; font-size: 27px; color: #94a39a; }`;
  return xhsSlide(
    7,
    "AGENT-NATIVE",
    "它是给 agent 用的，<br>不是给你点的",
    content,
    "模型无关",
    extra,
  );
}

function xhsCtaHtml(): string {
  const content = `
    <div class="bigterm mono"><span class="prompt">$</span> npx growthos demo</div>
    <p class="pull">生成一个示例仓库：故意让一条没证据的结论失败，再给你一份 88 分的 cockpit。</p>
    <div class="cta">评论区回复 <span class="lime">growthOS</span></div>
    <div class="small mono">第 0 周数据全是 0 · 写在 PROOF.md 里</div>`;
  const extra = `
    .bigterm { margin-top: 86px; padding: 42px 48px; border: 1px solid #2c3831; border-radius: 16px;
      background: rgba(7,19,12,.8); font-size: 44px; color: #f2f7f4; }
    .prompt { color: #4ee896; margin-right: 12px; }
    .cta { margin-top: 70px; display: inline-block; padding: 30px 44px; border-radius: 999px;
      background: #4ee896; color: #07130c; font-size: 38px; font-weight: 700; }
    .cta .lime { color: #07130c; text-decoration: underline; text-underline-offset: 6px; }
    .small { margin-top: 28px; font-size: 19px; letter-spacing: .08em; color: #6d7f74; }`;
  return xhsSlide(8, "START HERE", "开源，MIT，<br>今天就能跑", content, "无需注册", extra);
}

function ogHtml(): string {
  const body = `
  <div class="og">
    <div class="grid"></div>
    <div class="left">
      <div class="brand"><span class="brand-mark">/</span> growthOS</div>
      <h1>Marketing agents<br>need <span class="lime">receipts.</span></h1>
      <p>Signals in. Evidence-checked memos out.<br>Every claim cites a source. Or the build fails.</p>
      <div class="cmd mono"><span class="prompt">$</span> npx growthos demo</div>
    </div>
    <div class="right">
      <div class="term mono">
        <div class="line"><span class="fail">FAIL</span> Claim 2: no receipt.</div>
        <div class="line dim">  "HVAC owners want an AI SDR."</div>
        <div class="line gap"><span class="pass">PASS</span> 6 claims · 18 receipts</div>
        <div class="line"><span class="score">Score 88/100</span></div>
      </div>
    </div>
  </div>`;
  const css = `
  .og { position: relative; width: 1200px; height: 630px; padding: 64px 72px; display: flex; gap: 60px; align-items: center;
    background: radial-gradient(800px 500px at 90% 0%, rgba(78,232,150,.14), transparent 60%),
      radial-gradient(600px 500px at 0% 100%, rgba(31,122,72,.24), transparent 60%),
      linear-gradient(160deg, #0f1713, #0b0f0d 60%, #090c0a); }
  .left { width: 58%; position: relative; z-index: 2; }
  .brand { font-size: 28px; font-weight: 650; letter-spacing: -0.03em; }
  h1 { margin-top: 26px; font-size: 58px; line-height: 1.08; letter-spacing: -0.04em; color: #f2f7f4; font-weight: 700; }
  p { margin-top: 22px; font-size: 21px; line-height: 1.55; color: #cfe0d5; }
  .cmd { margin-top: 30px; display: inline-block; font-size: 20px; padding: 14px 22px; border: 1px solid #2c3831; border-radius: 10px; background: rgba(7,19,12,.7); }
  .prompt { color: #4ee896; margin-right: 8px; }
  .right { flex: 1; position: relative; z-index: 2; }
  .term { font-size: 19px; line-height: 1.9; padding: 34px 32px; border: 1px solid #2c3831; border-radius: 14px; background: rgba(7,19,12,.78); color: #cfe0d5; }
  .line { white-space: nowrap; }
  .gap { margin-top: 16px; }
  .fail { color: #ff7b72; font-weight: 700; }
  .pass { color: #4ee896; font-weight: 700; }
  .dim { color: #94a39a; padding-left: 62px; }
  .score { color: #f2cc60; }`;
  return shell("growthOS — Marketing agents need receipts", body, css);
}

function render(html: string, file: string, width: number, height: number): void {
  const htmlPath = file.replace(/\.png$/, ".html");
  fs.writeFileSync(htmlPath, html);
  if (!CHROME) {
    console.warn(
      `Chrome not found; wrote ${path.relative(ROOT, htmlPath)} only. Set CHROME_PATH to render PNGs.`,
    );
    return;
  }
  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--force-device-scale-factor=1",
      `--window-size=${width},${height}`,
      `--screenshot=${file}`,
      `file://${htmlPath}`,
    ],
    { stdio: "ignore" },
  );
  const size = fs.statSync(file).size;
  if (size < 10_000) throw new Error(`Screenshot looks empty: ${file} (${size} bytes)`);
  console.log(`wrote: ${path.relative(ROOT, file)} (${Math.round(size / 1024)} KB)`);
}

function checkLaunch(): void {
  const thread = fs.readFileSync(path.join(ROOT, "launch/x-thread.md"), "utf8");
  const copy = thread.split("## Pre-launch DMs")[0] ?? thread;
  const blocks = [...copy.matchAll(/```text\n([\s\S]*?)```/g)].map((match) => match[1] ?? "");
  let failures = 0;
  for (const [index, block] of blocks.entries()) {
    const length = [...block.trim()].length;
    if (length > 280) {
      failures += 1;
      console.log(`TOO LONG (${length}): block ${index + 1} — ${block.split("\n")[0]}`);
    }
  }
  if (blocks.length === 0) throw new Error("No text blocks found in launch/x-thread.md");
  console.log(`${blocks.length} X blocks checked; ${failures} over 280 characters.`);
  if (failures > 0) process.exitCode = 1;
}

function main(): void {
  if (process.argv.includes("--check-launch")) {
    checkLaunch();
    return;
  }
  const repo = loadRepo(ROOT);
  const signals = new Map(repo.signals.map((signal) => [signal.data.id, signal]));
  fs.mkdirSync(OUT, { recursive: true });

  for (const [index, card] of CARDS.entries()) {
    const signal = signalOrThrow(signals, card.signal);
    const slug = card.claim
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    const name = `${String(index + 1).padStart(2, "0")}-${slug}.png`;
    render(cardHtml(card, index, signal), path.join(OUT, name), 1080, 1080);
  }

  const xhsSlides: [string, string][] = [
    ["xiaohongshu-cover.png", xhsCoverHtml()],
    ["xiaohongshu-02-problem.png", xhsProblemHtml()],
    ["xiaohongshu-03-demo.png", xhsDemoHtml()],
    ["xiaohongshu-04-mechanism.png", xhsMechanismHtml()],
    ["xiaohongshu-05-structure.png", xhsStructureHtml()],
    ["xiaohongshu-06-score.png", xhsScoreHtml()],
    ["xiaohongshu-07-agent.png", xhsAgentHtml()],
    ["xiaohongshu-08-cta.png", xhsCtaHtml()],
  ];
  for (const [file, html] of xhsSlides) {
    render(html, path.join(OUT, file), 1242, 1660);
  }
  render(ogHtml(), path.join(OUT, "og-1200x630.png"), 1200, 630);
  fs.copyFileSync(path.join(OUT, "og-1200x630.png"), path.join(ROOT, "site/og.png"));
  console.log(`\n${CARDS.length} quote cards + 8-slide XHS carousel + OG image in launch/cards/.`);
}

main();
