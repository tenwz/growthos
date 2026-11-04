import fs from "node:fs";
import path from "node:path";
import type { RepoAudit } from "../evidence/check.js";
import { extractClaims } from "../markdown/citations.js";
import { daysSince, nowIso } from "../util/dates.js";
import { readText } from "../util/fs.js";
import type { ScoreCheck, ScoreResult, ScoreTier } from "./types.js";

export const RUBRIC_VERSION = "2026-11-v1";

const TIER_RANGES: { tier: ScoreTier; min: number; color: string }[] = [
  { tier: "Growth OS", min: 90, color: "brightgreen" },
  { tier: "System", min: 80, color: "green" },
  { tier: "Operator", min: 60, color: "yellow" },
  { tier: "Seedling", min: 40, color: "orange" },
  { tier: "Draft", min: 0, color: "red" },
];

export function tierFor(score: number): { tier: ScoreTier; color: string } {
  const found =
    TIER_RANGES.find((range) => score >= range.min) ?? TIER_RANGES[TIER_RANGES.length - 1];
  return { tier: found?.tier ?? "Draft", color: found?.color ?? "red" };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value);
}

function countRecentRuns(root: string, days: number): number {
  const dir = path.join(root, ".growthos", "runs");
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) => {
        try {
          return (
            daysSince(
              new Date(fs.statSync(path.join(dir, entry.name)).mtimeMs).toISOString(),
              new Date(),
            ) <= days
          );
        } catch {
          return false;
        }
      }).length;
  } catch {
    return 0;
  }
}

function readProof(root: string): { receipts: number; hasNumbers: boolean } {
  const candidates = [path.join(root, "PROOF.md"), path.join(root, "growth", "PROOF.md")];
  for (const candidate of candidates) {
    try {
      const text = readText(candidate);
      const receipts = new Set(text.match(/(?:sig|exp)_[0-9A-HJKMNP-TV-Z]{26}/g) ?? []).size;
      return { receipts, hasNumbers: /\d/.test(text) };
    } catch {}
  }
  return { receipts: 0, hasNumbers: false };
}

function specificity(claims: string[]): number {
  if (claims.length === 0) return 0;
  const specific = claims.filter(
    (claim) =>
      /\d/.test(claim) ||
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
        claim,
      ) ||
      /["“”].{8,}["“”]/.test(claim),
  ).length;
  return specific / claims.length;
}

export function scoreRepo(audit: RepoAudit, rubric = RUBRIC_VERSION): ScoreResult {
  const { repo, stats, primaryMemo } = audit;
  const checks: ScoreCheck[] = [];
  const add = (input: ScoreCheck) => checks.push(input);

  const receipts =
    primaryMemo?.receiptIds
      .map((id) => repo.signalById.get(id))
      .filter((record): record is NonNullable<typeof record> => Boolean(record)) ?? [];

  // Evidence integrity — 30
  const coverage = primaryMemo?.claimCoverage ?? 0;
  add({
    id: "evidence.claim_coverage",
    dimension: "Evidence integrity",
    points: 12,
    earned: round(coverage * 12),
    detail: `${primaryMemo?.claimsWithReceipts ?? 0}/${primaryMemo?.claimCount ?? 0} claims have a receipt.`,
  });

  const verbatimRatio =
    receipts.length === 0
      ? 0
      : receipts.filter((record) => record.data.quote.trim().length >= 20).length / receipts.length;
  add({
    id: "evidence.verbatim_quotes",
    dimension: "Evidence integrity",
    points: 6,
    earned: round(verbatimRatio * 6),
    detail: `${round(verbatimRatio * 100)}% of cited signals contain a substantive verbatim quote.`,
  });

  const active = repo.signals.filter((signal) => signal.data.status === "active");
  const publicWithSource = active.filter(
    (signal) => signal.data.provenance === "public" && Boolean(signal.data.source.url),
  ).length;
  const publicRatio = active.length === 0 ? 0 : publicWithSource / active.length;
  add({
    id: "evidence.public_sources",
    dimension: "Evidence integrity",
    points: 4,
    earned: round(publicRatio * 4),
    detail: `${publicWithSource}/${active.length} active signals are public with a source URL.`,
  });

  const diversity = primaryMemo?.sourceDiversity ?? 0;
  add({
    id: "evidence.source_diversity",
    dimension: "Evidence integrity",
    points: 4,
    earned: diversity >= 3 ? 4 : diversity === 2 ? 2 : 0,
    detail: `Primary memo draws on ${diversity} source channel(s).`,
  });

  const hashValid = repo.signals.filter((signal) => {
    if (!signal.data.integrity?.quote_hash) return false;
    const hashCheck = audit.checks.find(
      (check) => check.rule === "signal.hash_integrity" && check.signalId === signal.data.id,
    );
    return hashCheck?.ok ?? false;
  }).length;
  const hashRatio = repo.signals.length === 0 ? 0 : hashValid / repo.signals.length;
  add({
    id: "evidence.hash_integrity",
    dimension: "Evidence integrity",
    points: 4,
    earned: round(hashRatio * 4),
    detail: `${hashValid}/${repo.signals.length} signals have a valid receipt hash.`,
  });

  // Freshness and coverage — 15
  add({
    id: "freshness.signal_volume",
    dimension: "Freshness and coverage",
    points: 8,
    earned: round(clamp(stats.signalsLast30d / 10, 0, 1) * 8),
    detail: `${stats.signalsLast30d} signals captured in the last 30 days.`,
  });
  add({
    id: "freshness.segments",
    dimension: "Freshness and coverage",
    points: 4,
    earned:
      stats.segments.length >= 3
        ? 4
        : stats.segments.length === 2
          ? 2
          : stats.segments.length === 1
            ? 1
            : 0,
    detail: `${stats.segments.length} customer segment(s) represented.`,
  });
  const memoAge = primaryMemo
    ? daysSince(primaryMemo.memo.data.created_at)
    : Number.POSITIVE_INFINITY;
  add({
    id: "freshness.memo",
    dimension: "Freshness and coverage",
    points: 3,
    earned: memoAge <= 7 ? 3 : memoAge <= 14 ? 2 : 0,
    detail: primaryMemo ? `Latest memo is ${memoAge} day(s) old.` : "No memo found.",
  });

  // Loop closure — 20
  const experiments = repo.experiments;
  const linked = experiments.filter((experiment) => experiment.data.signal_ids.length > 0).length;
  add({
    id: "loop.signal_linked",
    dimension: "Loop closure",
    points: 8,
    earned: experiments.length === 0 ? 0 : round((linked / experiments.length) * 8),
    detail: `${linked}/${experiments.length} experiments are linked to signals.`,
  });
  const closedWithLearning = experiments.filter(
    (experiment) => experiment.data.decision && experiment.data.learning,
  ).length;
  add({
    id: "loop.closed_experiments",
    dimension: "Loop closure",
    points: 6,
    earned: Math.min(6, closedWithLearning * 2),
    detail: `${closedWithLearning} experiment(s) have a decision and a written learning.`,
  });
  add({
    id: "loop.learnings",
    dimension: "Loop closure",
    points: 6,
    earned: Math.min(6, stats.learningsLast30d * 2),
    detail: `${stats.learningsLast30d} learning file(s) written in the last 30 days.`,
  });

  // Agent operations — 15
  const expectedJobs = 6;
  add({
    id: "agents.job_coverage",
    dimension: "Agent operations",
    points: 6,
    earned: round(clamp(stats.jobs / expectedJobs, 0, 1) * 6),
    detail: `${stats.jobs}/${expectedJobs} job specs defined.`,
  });
  const approved = repo.jobs.filter((job) => job.data.human_approval).length;
  add({
    id: "agents.human_approval",
    dimension: "Agent operations",
    points: 5,
    earned: repo.jobs.length === 0 ? 0 : round((approved / repo.jobs.length) * 5),
    detail: `${approved}/${repo.jobs.length} jobs require human approval.`,
  });
  const recentRuns = countRecentRuns(repo.root, 14);
  add({
    id: "agents.recent_runs",
    dimension: "Agent operations",
    points: 4,
    earned: recentRuns > 0 ? 4 : 0,
    detail: `${recentRuns} agent run(s) logged in the last 14 days.`,
  });

  // Memo quality — 10
  const claimTexts = primaryMemo
    ? extractClaims(primaryMemo.memo.body).map((claim) => claim.text)
    : [];
  const specificityRatio = specificity(claimTexts);
  add({
    id: "memo.specificity",
    dimension: "Memo quality",
    points: 4,
    earned: round(specificityRatio * 4),
    detail: `${round(specificityRatio * 100)}% of claims contain a number, date, or verbatim phrase.`,
  });
  add({
    id: "memo.claim_limit",
    dimension: "Memo quality",
    points: 3,
    earned: claimTexts.length > 0 && claimTexts.length <= 7 ? 3 : 0,
    detail: `${claimTexts.length} claims; the target is 3-7.`,
  });
  const nextTest = primaryMemo ? /exp_[0-9A-HJKMNP-TV-Z]{26}/.test(primaryMemo.memo.body) : false;
  add({
    id: "memo.next_test",
    dimension: "Memo quality",
    points: 3,
    earned: nextTest ? 3 : 0,
    detail: nextTest
      ? "Memo links a next test to an experiment."
      : "Memo does not link a next test to an experiment.",
  });

  // Proof and cockpit — 10
  const cockpitFresh = repo.cockpitMtime
    ? daysSince(new Date(repo.cockpitMtime).toISOString()) <= 7
    : false;
  add({
    id: "proof.cockpit",
    dimension: "Proof and cockpit",
    points: 5,
    earned: cockpitFresh ? 5 : 0,
    detail: repo.cockpitMtime ? "Cockpit generated within 7 days." : "No cockpit generated yet.",
  });
  const proof = readProof(repo.root);
  add({
    id: "proof.public_numbers",
    dimension: "Proof and cockpit",
    points: 5,
    earned: proof.receipts >= 3 && proof.hasNumbers ? 5 : 0,
    detail:
      proof.receipts >= 3 && proof.hasNumbers
        ? `PROOF.md references ${proof.receipts} receipts and real numbers.`
        : "PROOF.md needs at least 3 receipt links and real metrics.",
  });

  const rawScore = checks.reduce((sum, check) => sum + check.earned, 0);
  const synthetic = stats.syntheticShare > 0.5;
  const minSignals = repo.config?.score.min_signals ?? 20;
  const certified =
    !synthetic &&
    stats.activeSignals >= minSignals &&
    stats.publicShare >= 0.5 &&
    (primaryMemo?.ok ?? false);
  const capApplied = !synthetic && stats.activeSignals < minSignals ? 60 : null;
  const score = capApplied === null ? rawScore : Math.min(rawScore, capApplied);
  const { tier, color } = tierFor(score);

  return {
    score,
    tier,
    color,
    certified,
    label: synthetic ? "growthOS demo" : "growthOS",
    rubric,
    generatedAt: nowIso(),
    checks,
    stats,
    synthetic,
    capApplied,
  };
}

export function explainScore(result: ScoreResult): string {
  const lines: string[] = [];
  lines.push(`# Growth OS Score — ${result.score}/100 (${result.tier})`);
  lines.push("");
  lines.push(
    `Rubric: ${result.rubric} · ${result.certified ? "certified" : result.synthetic ? "demo" : "uncertified"}`,
  );
  if (result.capApplied !== null) {
    lines.push(
      `Cap applied: ${result.capApplied} because the repo has fewer than the minimum signals.`,
    );
  }
  lines.push("");
  lines.push("| Check | Dimension | Points | Earned | Detail |");
  lines.push("| --- | --- | ---: | ---: | --- |");
  for (const check of result.checks) {
    lines.push(
      `| ${check.id} | ${check.dimension} | ${check.points} | ${check.earned} | ${check.detail.replace(/\|/g, "\\|")} |`,
    );
  }
  return lines.join("\n");
}
