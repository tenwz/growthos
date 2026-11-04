import path from "node:path";
import type { MemoAudit, RepoAudit } from "../evidence/check.js";
import { extractClaims } from "../markdown/citations.js";
import type { LoadedRepo } from "../repo/load.js";
import { repoPaths } from "../repo/paths.js";
import { badgeFor, badgeSvg } from "../score/badge.js";
import { explainScore } from "../score/rubric.js";
import type { ScoreResult } from "../score/types.js";
import { addDays, formatDate, isoWeek, nowIso } from "../util/dates.js";
import { ensureDir, writeText } from "../util/fs.js";
import { type BarDatum, CHANNEL_COLORS, barChart, donut, progressBars } from "./charts.js";

export interface CockpitOptions {
  theme?: "dark" | "light";
  title?: string;
  repoUrl?: string;
}

export interface CockpitResult {
  htmlPath: string;
  badgeJsonPath: string;
  badgeSvgPath: string;
  shareCardPath: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 11)}…` : id;
}

function weeklySignals(repo: LoadedRepo, weeks = 8): BarDatum[] {
  const now = new Date();
  const weekKeys: string[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const key = isoWeek(addDays(now, -7 * i));
    if (!weekKeys.includes(key)) weekKeys.push(key);
  }
  const channels = [...new Set(repo.signals.map((signal) => signal.data.source.kind))];
  const counts = new Map<string, Map<string, number>>();
  for (const signal of repo.signals) {
    const key = isoWeek(signal.data.captured_at);
    if (!weekKeys.includes(key)) continue;
    const bucket = counts.get(key) ?? new Map<string, number>();
    bucket.set(signal.data.source.kind, (bucket.get(signal.data.source.kind) ?? 0) + 1);
    counts.set(key, bucket);
  }
  return weekKeys.map((key) => {
    const bucket = counts.get(key) ?? new Map<string, number>();
    const segments = channels.map((channel, index) => ({
      label: channel,
      value: bucket.get(channel) ?? 0,
      color: CHANNEL_COLORS[index % CHANNEL_COLORS.length] as string,
    }));
    return {
      label: `W${key.split("-W")[1] ?? ""}`,
      value: segments.reduce((sum, segment) => sum + segment.value, 0),
      segments,
    };
  });
}

function pipelineFromMetrics(repo: LoadedRepo): {
  conversations: number;
  qualified: number;
  meetings: number;
  pipelineUsd: number;
} {
  const fallback = { conversations: 0, qualified: 0, meetings: 0, pipelineUsd: 0 };
  const metrics = repo.metrics
    .map((metric) => metric.data)
    .filter(
      (data) =>
        data && typeof data === "object" && data.pipeline && typeof data.pipeline === "object",
    );
  const latest = metrics[metrics.length - 1];
  const pipeline = latest?.pipeline as Record<string, unknown> | undefined;
  if (!pipeline) return fallback;
  return {
    conversations: Number(pipeline.conversations ?? 0),
    qualified: Number(pipeline.qualified ?? 0),
    meetings: Number(pipeline.meetings ?? 0),
    pipelineUsd: Number(pipeline.pipeline_usd ?? 0),
  };
}

function channelDiversity(repo: LoadedRepo): { label: string; value: number; color: string }[] {
  const counts = new Map<string, number>();
  for (const signal of repo.signals) {
    counts.set(signal.data.source.kind, (counts.get(signal.data.source.kind) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      color: CHANNEL_COLORS[index % CHANNEL_COLORS.length] as string,
    }));
}

function renderClaim(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /\[@((?:sig)_[0-9A-HJKMNP-TV-Z]{26})\]/g,
    (_match, id: string) =>
      `<a class="cite" href="#${escapeHtml(id)}" title="${escapeHtml(id)}">${escapeHtml(shortId(id))}</a>`,
  );
}

function scoreRing(score: number): string {
  const size = 196;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.max(0, Math.min(1, score / 100));
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Growth OS Score ${score} out of 100">
  <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#1c2128" stroke-width="${stroke}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#c6ff3d" stroke-width="${stroke}"
    stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(
      1,
    )}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  <text x="${size / 2}" y="${size / 2 + 8}" text-anchor="middle" fill="#e6edf3" font-size="54" font-weight="700" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${score}</text>
  <text x="${size / 2}" y="${size / 2 + 32}" text-anchor="middle" fill="#8b949e" font-size="11" letter-spacing="2" font-family="ui-monospace, monospace">OUT OF 100</text>
</svg>`;
}

function failingClaims(audits: MemoAudit[]): { path: string; claim: string }[] {
  const failures: { path: string; claim: string }[] = [];
  for (const audit of audits) {
    for (const error of audit.errors) {
      if (error.claim) {
        failures.push({ path: audit.memo.relPath, claim: error.claim });
      }
    }
  }
  return failures;
}

function dimensionRows(score: ScoreResult): { label: string; earned: number; points: number }[] {
  const dimensions = [...new Set(score.checks.map((check) => check.dimension))];
  return dimensions.map((dimension) => {
    const checks = score.checks.filter((check) => check.dimension === dimension);
    return {
      label: dimension,
      earned: checks.reduce((sum, check) => sum + check.earned, 0),
      points: checks.reduce((sum, check) => sum + check.points, 0),
    };
  });
}

function shareCardSvg(repoName: string, score: ScoreResult, repoUrl: string): string {
  const metrics = [
    { label: "SIGNALS", value: String(score.stats.activeSignals) },
    { label: "RECEIPTS", value: String(score.stats.receiptsUsed) },
    { label: "EXPERIMENTS", value: String(score.stats.experiments) },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#07080a"/>
  <g stroke="#161b22" stroke-width="1">
    ${Array.from({ length: 11 }, (_, i) => `<line x1="${80 + i * 104}" y1="0" x2="${80 + i * 104}" y2="630"/>`).join("")}
    ${Array.from({ length: 5 }, (_, i) => `<line x1="0" y1="${90 + i * 112}" x2="1200" y2="${90 + i * 112}"/>`).join("")}
  </g>
  <g transform="translate(80 76)">
    <rect x="0" y="12" width="5" height="12" rx="2" fill="#c6ff3d"/>
    <rect x="9" y="6" width="5" height="18" rx="2" fill="#c6ff3d"/>
    <rect x="18" y="0" width="5" height="24" rx="2" fill="#c6ff3d"/>
    <text x="36" y="20" fill="#e6edf3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" font-weight="700">growthOS</text>
  </g>
  <text x="80" y="196" fill="#8b949e" font-family="ui-monospace, monospace" font-size="14" letter-spacing="3">GROWTH OS SCORE</text>
  <text x="80" y="340" fill="#e6edf3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="150" font-weight="700">${score.score}</text>
  <text x="330" y="300" fill="#c6ff3d" font-family="ui-monospace, monospace" font-size="22">/ 100</text>
  <rect x="330" y="320" width="${Math.max(120, score.tier.length * 14 + 40)}" height="34" rx="17" fill="#16210a" stroke="#3d5c12"/>
  <text x="350" y="343" fill="#c6ff3d" font-family="ui-monospace, monospace" font-size="15">${escapeHtml(score.tier.toUpperCase())}</text>
  <text x="80" y="420" fill="#c9d1d9" font-family="ui-sans-serif, system-ui" font-size="28">${escapeHtml(repoName)}</text>
  <text x="80" y="456" fill="#8b949e" font-family="ui-sans-serif, system-ui" font-size="18">Evidence-first growth memory for AI agents.</text>
  ${metrics
    .map(
      (metric, index) => `<g transform="translate(${620 + index * 180} 250)">
      <text x="0" y="0" fill="#8b949e" font-family="ui-monospace, monospace" font-size="12" letter-spacing="2">${metric.label}</text>
      <text x="0" y="58" fill="#e6edf3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="48" font-weight="700">${metric.value}</text>
    </g>`,
    )
    .join("")}
  <text x="80" y="572" fill="#6e7681" font-family="ui-monospace, monospace" font-size="14">${escapeHtml(repoUrl)}</text>
  <text x="1120" y="572" text-anchor="end" fill="#6e7681" font-family="ui-monospace, monospace" font-size="14">receipts or it didn't happen</text>
</svg>`;
}

export function renderCockpit(
  repo: LoadedRepo,
  audit: RepoAudit,
  score: ScoreResult,
  options: CockpitOptions = {},
): string {
  const theme = options.theme ?? repo.config?.cockpit.theme ?? "dark";
  const title =
    options.title ?? repo.config?.cockpit.title ?? repo.config?.repo.name ?? "Growth OS";
  const repoUrl = options.repoUrl ?? "https://github.com/tenwz/growthos";
  const weekly = weeklySignals(repo);
  const channels = channelDiversity(repo);
  const pipeline = pipelineFromMetrics(repo);
  const claims = audit.primaryMemo ? extractClaims(audit.primaryMemo.memo.body) : [];
  const failures = failingClaims(audit.memoAudits);
  const experiments = repo.experiments;
  const receiptCoverage = audit.primaryMemo?.claimCoverage ?? 0;
  const generatedAt = nowIso();
  const badge = badgeFor(score);
  const dimensions = dimensionRows(score);
  const badgePreview = badgeSvg(score);

  const claimItems = claims
    .map(
      (claim) => `<li>
        <div class="claim-text">${renderClaim(claim.text)}</div>
        <div class="claim-meta">${claim.citations.length} receipt${claim.citations.length === 1 ? "" : "s"}</div>
      </li>`,
    )
    .join("");

  const failureItems = failures.length
    ? failures
        .slice(0, 6)
        .map(
          (failure) =>
            `<li><code>${escapeHtml(failure.path)}</code><span>${escapeHtml(
              truncate(failure.claim, 160),
            )}</span></li>`,
        )
        .join("")
    : `<li class="ok">No unsubstantiated claims. Every claim has a receipt.</li>`;

  const experimentRows = experiments
    .map(
      (experiment) => `<tr>
      <td><code>${escapeHtml(shortId(experiment.data.id))}</code></td>
      <td>${escapeHtml(truncate(experiment.data.hypothesis, 88))}</td>
      <td><span class="pill status-${escapeHtml(experiment.data.status)}">${escapeHtml(
        experiment.data.status,
      )}</span></td>
      <td>${escapeHtml(experiment.data.primary_metric.name)}</td>
      <td class="num">${experiment.data.primary_metric.target ?? "—"}</td>
      <td class="num">${experiment.data.primary_metric.observed ?? "—"}</td>
      <td>${
        experiment.data.decision
          ? `<span class="pill decision-${escapeHtml(
              experiment.data.decision,
            )}">${escapeHtml(experiment.data.decision)}</span>`
          : "—"
      }</td>
    </tr>`,
    )
    .join("");

  const nextTests = experiments
    .filter((experiment) => !experiment.data.decision)
    .map(
      (experiment) => `<li>
      <strong>${escapeHtml(experiment.data.primary_metric.name)}</strong>
      <span>${escapeHtml(truncate(experiment.data.hypothesis, 140))}</span>
    </li>`,
    )
    .join("");

  const receiptList = (audit.primaryMemo?.receiptIds ?? [])
    .map((id) => {
      const signal = repo.signalById.get(id);
      if (!signal) return "";
      return `<li id="${escapeHtml(id)}">
        <div class="receipt-quote">“${escapeHtml(truncate(signal.data.quote, 240))}”</div>
        <div class="receipt-meta"><code>${escapeHtml(id)}</code> · ${escapeHtml(
          signal.data.source.kind,
        )}${signal.data.source.url ? ` · <span>${escapeHtml(truncate(signal.data.source.url, 70))}</span>` : ""}</div>
      </li>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)} — Growth OS Cockpit</title>
<meta name="description" content="Evidence-first growth cockpit generated by growthOS."/>
<style>
:root{
  --bg:#07080a; --panel:#0d1117; --panel-2:#11161d; --line:#222831; --line-soft:#1a2028;
  --text:#e6edf3; --muted:#8b949e; --dim:#6e7681; --lime:#c6ff3d; --lime-2:#a8e02b;
  --red:#ff7b72; --amber:#f2cc60; --green:#7ee787; --radius:16px;
  --mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
  --sans:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;
}
[data-theme="light"]{
  --bg:#f6f7f4; --panel:#ffffff; --panel-2:#f0f2ec; --line:#dfe3d8; --line-soft:#e9ece3;
  --text:#171a14; --muted:#5c6656; --dim:#7b8575; --lime:#5f8c00; --lime-2:#4d7300;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:var(--sans)}
body{font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:var(--lime);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1180px;margin:0 auto;padding:32px 24px 56px}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:28px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-weight:700;letter-spacing:-.02em;font-size:18px}
.brand svg{display:block}
.meta{font-family:var(--mono);font-size:11px;color:var(--dim);text-align:right;line-height:1.7}
.hero{display:grid;grid-template-columns:auto 1fr auto;gap:28px;align-items:center;background:
  radial-gradient(900px 260px at 18% 0%, rgba(198,255,61,.08), transparent 60%),var(--panel);
  border:1px solid var(--line);border-radius:var(--radius);padding:28px 30px;margin-bottom:18px}
.hero-copy h1{font-size:30px;line-height:1.15;margin:0 0 10px;letter-spacing:-.03em}
.hero-copy p{margin:0;color:var(--muted);max-width:560px}
.hero-copy .tier{display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:6px 12px;border-radius:999px;
  background:rgba(198,255,61,.08);border:1px solid rgba(198,255,61,.28);font-family:var(--mono);font-size:12px;color:var(--lime)}
.hero-side{text-align:right;font-family:var(--mono);font-size:11px;color:var(--muted)}
.hero-side img{display:block;margin-left:auto;margin-bottom:10px;max-width:100%}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.stat .k{font-family:var(--mono);font-size:10px;letter-spacing:2px;color:var(--dim);text-transform:uppercase}
.stat .v{font-family:var(--mono);font-size:30px;font-weight:700;margin-top:6px;letter-spacing:-.03em}
.stat .s{font-size:12px;color:var(--muted);margin-top:2px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:22px 24px;margin-bottom:18px}
.card h2{font-size:13px;font-family:var(--mono);letter-spacing:1.6px;text-transform:uppercase;color:var(--muted);
  margin:0 0 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.card h2 .hint{font-size:10px;letter-spacing:0;text-transform:none;color:var(--dim)}
.legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px;font-family:var(--mono);font-size:10px;color:var(--muted)}
.legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.donut-wrap{display:flex;align-items:center;gap:24px}
.fail-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;font-size:12px}
.fail-list li{display:flex;flex-direction:column;gap:3px;padding:10px 12px;border:1px solid var(--line-soft);
  border-radius:9px;background:var(--panel-2);color:var(--muted)}
.fail-list li code{color:var(--red);font-family:var(--mono);font-size:10px}
.fail-list li.ok{border-color:rgba(126,231,135,.25);color:var(--green);background:rgba(126,231,135,.05)}
.claims{list-style:none;padding:0;margin:0;counter-reset:claim}
.claims li{position:relative;padding:14px 16px 14px 52px;border-bottom:1px solid var(--line-soft)}
.claims li:last-child{border-bottom:0}
.claims li::before{counter-increment:claim;content:counter(claim,decimal-leading-zero);position:absolute;left:14px;top:15px;
  font-family:var(--mono);font-size:11px;color:var(--lime);opacity:.8}
.claim-text{font-size:15px;line-height:1.55}
.claim-meta{font-family:var(--mono);font-size:10px;color:var(--dim);margin-top:6px}
.cite{display:inline-block;font-family:var(--mono);font-size:10px;padding:1px 6px;border-radius:5px;
  background:rgba(198,255,61,.1);border:1px solid rgba(198,255,61,.22);color:var(--lime);vertical-align:1px;margin-left:2px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);
  font-weight:500;padding:0 10px 10px;border-bottom:1px solid var(--line)}
td{padding:11px 10px;border-bottom:1px solid var(--line-soft);color:var(--muted);vertical-align:top}
td:first-child{color:var(--text)}
td.num{font-family:var(--mono);text-align:right;color:var(--text)}
tr:last-child td{border-bottom:0}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-family:var(--mono);font-size:10px;border:1px solid var(--line)}
.status-running{color:var(--lime);border-color:rgba(198,255,61,.3);background:rgba(198,255,61,.07)}
.status-complete{color:var(--green);border-color:rgba(126,231,135,.3);background:rgba(126,231,135,.07)}
.status-proposed{color:var(--muted)}
.status-abandoned{color:var(--dim)}
.decision-scale{color:var(--green);border-color:rgba(126,231,135,.3)}
.decision-iterate{color:var(--amber);border-color:rgba(242,204,96,.3)}
.decision-kill{color:var(--red);border-color:rgba(255,123,114,.3)}
.decision-inconclusive{color:var(--muted)}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.next-list,.receipt-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px}
.next-list li{display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid var(--line-soft);border-radius:10px;background:var(--panel-2)}
.next-list strong{font-family:var(--mono);font-size:11px;color:var(--lime);font-weight:500}
.next-list span{font-size:12px;color:var(--muted)}
.bars{display:flex;flex-direction:column;gap:12px}
.bar-row{display:grid;grid-template-columns:120px 1fr 44px;gap:12px;align-items:center;font-size:12px;color:var(--muted)}
.bar-track{height:10px;border-radius:6px;background:var(--panel-2);overflow:hidden}
.bar-fill{height:100%;border-radius:6px;background:var(--lime)}
.bar-row .n{font-family:var(--mono);font-size:10px;text-align:right;color:var(--dim)}
details{border-top:1px solid var(--line);padding-top:16px;margin-top:4px}
summary{cursor:pointer;font-family:var(--mono);font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.receipt-list{margin-top:16px}
.receipt-list li{padding:12px 14px;border:1px solid var(--line-soft);border-radius:10px;background:var(--panel-2)}
.receipt-quote{font-size:13px;color:var(--text);line-height:1.55}
.receipt-meta{font-family:var(--mono);font-size:10px;color:var(--dim);margin-top:6px;word-break:break-all}
.footer{margin-top:28px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:16px;
  font-family:var(--mono);font-size:10px;color:var(--dim);flex-wrap:wrap}
.demo-banner{display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:18px;border-radius:10px;
  border:1px solid rgba(242,204,96,.28);background:rgba(242,204,96,.06);font-family:var(--mono);font-size:11px;color:var(--amber)}
@media(max-width:860px){
  .hero{grid-template-columns:1fr;text-align:left}
  .hero-side{text-align:left}
  .hero-side img{margin-left:0}
  .stats{grid-template-columns:1fr 1fr}
  .grid,.two-col{grid-template-columns:1fr}
  .wrap{padding:20px 14px 40px}
}
</style>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect x="2" y="13" width="4" height="7" rx="1.5" fill="#c6ff3d"/><rect x="9" y="8" width="4" height="12" rx="1.5" fill="#c6ff3d"/><rect x="16" y="2" width="4" height="18" rx="1.5" fill="#c6ff3d"/></svg>
      growthOS
    </div>
    <div class="meta">
      ${escapeHtml(title)}<br/>
      generated ${escapeHtml(formatDate(generatedAt))} · rubric ${escapeHtml(score.rubric)}
    </div>
  </header>

  ${score.synthetic ? `<div class="demo-banner">SYNTHETIC DEMO — Summit Air is a fictional HVAC SaaS company. Every signal is marked <code>provenance: synthetic</code>. The mechanics are real; the customers are not.</div>` : ""}

  <section class="hero">
    <div>${scoreRing(score.score)}</div>
    <div class="hero-copy">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(score.certified ? "Certified growth memory. Every published claim resolves to a receipt." : score.synthetic ? "A working demo of the evidence loop: capture → memo → experiment → cockpit." : "Uncertified. Capture more public signals, close the loop, and publish receipts.")}</p>
      <span class="tier">${escapeHtml(score.tier)} · ${score.certified ? "certified" : score.synthetic ? "demo" : "uncertified"} · ${score.stats.activeSignals} active signals</span>
    </div>
    <div class="hero-side">
      <div>${badgePreview}</div>
      <div>${escapeHtml(repoUrl.replace(/^https?:\/\//, ""))}</div>
    </div>
  </section>

  <section class="stats">
    <div class="stat"><div class="k">Signals</div><div class="v">${score.stats.activeSignals}</div><div class="s">${score.stats.signalsLast30d} in the last 30 days</div></div>
    <div class="stat"><div class="k">Claims</div><div class="v">${score.stats.claims}</div><div class="s">${score.stats.claimsWithReceipts} with receipts</div></div>
    <div class="stat"><div class="k">Receipts</div><div class="v">${score.stats.receiptsUsed}</div><div class="s">${score.stats.channels.length} source channels</div></div>
    <div class="stat"><div class="k">Experiments</div><div class="v">${score.stats.experiments}</div><div class="s">${score.stats.completeExperiments} closed · ${score.stats.runningExperiments} running</div></div>
  </section>

  <section class="grid">
    <div class="card">
      <h2>Signal volume <span class="hint">last 8 weeks</span></h2>
      ${barChart(weekly)}
      <div class="legend">${channels
        .map(
          (channel) =>
            `<span><i style="background:${channel.color}"></i>${escapeHtml(channel.label)} · ${channel.value}</span>`,
        )
        .join("")}</div>
    </div>
    <div class="card">
      <h2>Receipt coverage <span class="hint">claims → signals</span></h2>
      <div class="donut-wrap">
        ${donut(receiptCoverage, 132, "claims cited")}
        <ul class="fail-list">${failureItems}</ul>
      </div>
    </div>
  </section>

  <section class="card">
    <h2>What the market is telling us <span class="hint">${escapeHtml(
      audit.primaryMemo?.memo.relPath ?? "no memo",
    )}</span></h2>
    <ol class="claims">${claimItems || `<li class="ok">No passing memo yet.</li>`}</ol>
    <details>
      <summary>Receipts (${audit.primaryMemo?.receiptIds.length ?? 0})</summary>
      <ul class="receipt-list">${receiptList}</ul>
    </details>
  </section>

  <section class="card">
    <h2>Experiment ledger <span class="hint">${experiments.length} experiments</span></h2>
    <table>
      <thead><tr><th>ID</th><th>Hypothesis</th><th>Status</th><th>Metric</th><th>Target</th><th>Observed</th><th>Decision</th></tr></thead>
      <tbody>${experimentRows || `<tr><td colspan="7">No experiments yet. Link a hypothesis to a signal.</td></tr>`}</tbody>
    </table>
  </section>

  <section class="grid">
    <div class="card">
      <h2>Pipeline <span class="hint">from metrics</span></h2>
      <div class="bars">
        ${[
          { label: "Conversations", value: pipeline.conversations },
          { label: "Qualified", value: pipeline.qualified },
          { label: "Meetings", value: pipeline.meetings },
        ]
          .map((item) => {
            const max = Math.max(1, pipeline.conversations, pipeline.qualified, pipeline.meetings);
            return `<div class="bar-row"><span>${item.label}</span><div class="bar-track"><div class="bar-fill" style="width:${(
              (item.value / max) * 100
            ).toFixed(1)}%"></div></div><span class="n">${item.value}</span></div>`;
          })
          .join("")}
      </div>
      <div class="legend"><span>$${pipeline.pipelineUsd.toLocaleString("en-US")} synthetic pipeline</span></div>
    </div>
    <div class="card">
      <h2>What to test next <span class="hint">open experiments</span></h2>
      <ul class="next-list">${nextTests || "<li><span>No open experiments. Add one from a memo claim.</span></li>"}</ul>
    </div>
  </section>

  <section class="card">
    <h2>Score breakdown <span class="hint">${score.score}/100 · ${escapeHtml(score.tier)}</span></h2>
    ${progressBars(dimensions)}
    <details>
      <summary>How the score is calculated</summary>
      <pre style="white-space:pre-wrap;font-family:var(--mono);font-size:11px;color:var(--muted);margin:14px 0 0">${escapeHtml(
        explainScore(score),
      )}</pre>
    </details>
  </section>

  <footer class="footer">
    <span>Generated by growthOS v0.1 · ${escapeHtml(score.rubric)} · no network requests</span>
    <span>receipts or it didn't happen</span>
  </footer>
</div>
</body>
</html>
`;
}

export function generateCockpit(
  repo: LoadedRepo,
  audit: RepoAudit,
  score: ScoreResult,
  options: CockpitOptions = {},
): CockpitResult {
  const html = renderCockpit(repo, audit, score, options);
  const cockpitDir = repoPaths(repo.root).cockpit;
  ensureDir(cockpitDir);
  const htmlPath = path.join(cockpitDir, "index.html");
  const badgeJsonPath = path.join(cockpitDir, "badge.json");
  const badgeSvgPath = path.join(cockpitDir, "badge.svg");
  const shareCardPath = path.join(cockpitDir, "share-card.svg");
  const repoUrl = options.repoUrl ?? "https://github.com/tenwz/growthos";
  writeText(htmlPath, html);
  writeText(badgeJsonPath, `${JSON.stringify(badgeFor(score), null, 2)}\n`);
  writeText(badgeSvgPath, badgeSvg(score));
  writeText(shareCardPath, shareCardSvg(repo.config?.repo.name ?? "Growth OS", score, repoUrl));
  return { htmlPath, badgeJsonPath, badgeSvgPath, shareCardPath, html };
}
