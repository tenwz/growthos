import {
  claimSimilarity,
  extractClaims,
  extractReceiptTableIds,
  extractSection,
  hasReceiptsTable,
} from "../markdown/citations.js";
import type {
  IssueSeverity,
  LoadedRepo,
  MemoRecord,
  RepoIssue,
  SignalRecord,
} from "../repo/load.js";
import { daysSince } from "../util/dates.js";
import { verifyQuoteHash } from "./hash.js";
import {
  type ClaimReceipts,
  resolveClaimReceipts,
  sourceDiversity,
  uniqueReceiptIds,
} from "./receipts.js";

export interface CheckResult {
  rule: string;
  severity: IssueSeverity;
  ok: boolean;
  message: string;
  path?: string;
  line?: number;
  claim?: string;
  signalId?: string;
}

export interface MemoAudit {
  memo: MemoRecord;
  claims: ClaimReceipts[];
  checks: CheckResult[];
  errors: CheckResult[];
  warnings: CheckResult[];
  ok: boolean;
  claimCount: number;
  claimsWithReceipts: number;
  claimCoverage: number;
  receiptIds: string[];
  receiptsUsed: number;
  sourceDiversity: number;
  staleDays: number;
}

export interface RepoStats {
  signals: number;
  activeSignals: number;
  publicSignals: number;
  internalSignals: number;
  syntheticSignals: number;
  signalsLast30d: number;
  channels: string[];
  segments: string[];
  memos: number;
  publishedMemos: number;
  draftMemos: number;
  rejectedMemos: number;
  claims: number;
  claimsWithReceipts: number;
  receiptsUsed: number;
  experiments: number;
  completeExperiments: number;
  runningExperiments: number;
  jobs: number;
  learnings: number;
  learningsLast30d: number;
  latestMemoAt: string | null;
  cockpitMtime: number | null;
  proofMtime: number | null;
  syntheticShare: number;
  publicShare: number;
}

export interface RepoAudit {
  repo: LoadedRepo;
  memoAudits: MemoAudit[];
  primaryMemo: MemoAudit | null;
  checks: CheckResult[];
  errors: CheckResult[];
  warnings: CheckResult[];
  issues: RepoIssue[];
  stats: RepoStats;
  ok: boolean;
}

export interface AuditOptions {
  strict?: boolean;
  now?: Date;
  minReceiptsPerClaim?: number;
  minSourceDiversity?: number;
  maxClaims?: number;
}

const EXPECTED_JOB_IDS = [
  "job_customer-truth",
  "job_founder-content",
  "job_outbound-signal",
  "job_creative-testing",
  "job_ai-search-visibility",
  "job_growth-cockpit",
];

const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: "OpenAI key", pattern: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: "Anthropic key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "Private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function hasSource(signal: SignalRecord): boolean {
  return Boolean(signal.data.source.url) || Boolean(signal.data.evidence);
}

function severityForPublished(published: boolean): IssueSeverity {
  return published ? "error" : "warning";
}

function add(checks: CheckResult[], input: Omit<CheckResult, "ok"> & { ok: boolean }): CheckResult {
  const result: CheckResult = { ...input };
  checks.push(result);
  return result;
}

export function auditMemo(
  repo: LoadedRepo,
  memo: MemoRecord,
  options: AuditOptions = {},
): MemoAudit {
  const now = options.now ?? new Date();
  const strict = options.strict ?? false;
  const minReceipts = options.minReceiptsPerClaim ?? 1;
  const minDiversity = options.minSourceDiversity ?? 2;
  const maxClaims = options.maxClaims ?? 7;
  const published = memo.data.status === "published";
  const checks: CheckResult[] = [];
  const claims = extractClaims(memo.body);
  const resolutions = resolveClaimReceipts(claims, repo.signalById);

  for (const resolution of resolutions) {
    const { claim } = resolution;
    const citationCount = resolution.signalIds.length;

    add(checks, {
      rule: "memo.claim.receipt_count",
      severity: "error",
      ok: citationCount >= minReceipts,
      message:
        citationCount >= minReceipts
          ? `Claim ${claim.index} has ${citationCount} receipt(s).`
          : `Claim ${claim.index} has no receipt. Add [@sig_...] or remove the claim.`,
      path: memo.relPath,
      line: claim.line,
      claim: claim.text,
    });

    for (const missing of resolution.missing) {
      add(checks, {
        rule: "memo.claim.missing_receipt",
        severity: "error",
        ok: false,
        message: `Claim ${claim.index} cites ${missing}, which does not resolve to a signal.`,
        path: memo.relPath,
        line: claim.line,
        claim: claim.text,
        signalId: missing,
      });
    }

    for (const receipt of resolution.receipts) {
      const signal = receipt.data;
      if (signal.status !== "active") {
        add(checks, {
          rule: "memo.claim.inactive_receipt",
          severity: severityForPublished(published),
          ok: false,
          message: `Claim ${claim.index} cites ${signal.id}, whose status is ${signal.status}.`,
          path: memo.relPath,
          line: claim.line,
          claim: claim.text,
          signalId: signal.id,
        });
      }
      if (signal.provenance === "synthetic" && published) {
        add(checks, {
          rule: "memo.claim.synthetic_receipt",
          severity: "error",
          ok: false,
          message: `Published memo cites synthetic signal ${signal.id}. Synthetic data cannot back a published claim.`,
          path: memo.relPath,
          line: claim.line,
          claim: claim.text,
          signalId: signal.id,
        });
      }
    }
  }

  const receiptIds = uniqueReceiptIds(resolutions);
  const receiptRecords = receiptIds
    .map((id) => repo.signalById.get(id))
    .filter((record): record is SignalRecord => Boolean(record));
  const diversity = sourceDiversity(receiptRecords);

  add(checks, {
    rule: "memo.source_diversity",
    severity: strict ? "error" : "warning",
    ok: diversity >= minDiversity,
    message:
      diversity >= minDiversity
        ? `Receipts span ${diversity} source channels.`
        : `Receipts span only ${diversity} source channel(s); require at least ${minDiversity}.`,
    path: memo.relPath,
  });

  add(checks, {
    rule: "memo.claim_count",
    severity: strict ? "error" : "warning",
    ok: claims.length <= maxClaims,
    message:
      claims.length <= maxClaims
        ? `${claims.length} claims (limit ${maxClaims}).`
        : `${claims.length} claims exceeds the limit of ${maxClaims}. Prefer fewer, sharper claims.`,
    path: memo.relPath,
  });

  const hasTable = hasReceiptsTable(memo.body);
  const tableIds = extractReceiptTableIds(memo.body);
  const tableMatches =
    receiptIds.length === tableIds.length && tableIds.every((id) => receiptIds.includes(id));
  add(checks, {
    rule: "memo.receipts_table",
    severity: severityForPublished(published),
    ok: hasTable && tableMatches,
    message: !hasTable
      ? "Missing generated ## Receipts table. Run `growthos task apply` or add it."
      : tableMatches
        ? "Receipts table matches claim citations."
        : "Receipts table does not match claim citations.",
    path: memo.relPath,
  });

  if (memo.data.claim_count !== undefined && memo.data.claim_count !== claims.length) {
    add(checks, {
      rule: "memo.metadata.claim_count",
      severity: "warning",
      ok: false,
      message: `Frontmatter claim_count is ${memo.data.claim_count}, but the memo has ${claims.length} claims.`,
      path: memo.relPath,
    });
  }
  if (memo.data.receipt_count !== undefined && memo.data.receipt_count !== receiptIds.length) {
    add(checks, {
      rule: "memo.metadata.receipt_count",
      severity: "warning",
      ok: false,
      message: `Frontmatter receipt_count is ${memo.data.receipt_count}, but the memo uses ${receiptIds.length} receipts.`,
      path: memo.relPath,
    });
  }
  if (memo.data.source_diversity !== undefined && memo.data.source_diversity !== diversity) {
    add(checks, {
      rule: "memo.metadata.source_diversity",
      severity: "warning",
      ok: false,
      message: `Frontmatter source_diversity is ${memo.data.source_diversity}, but receipts span ${diversity} channels.`,
      path: memo.relPath,
    });
  }

  const staleDays = daysSince(memo.data.created_at, now);
  add(checks, {
    rule: "memo.freshness",
    severity: strict ? "error" : "warning",
    ok: staleDays <= 14,
    message:
      staleDays <= 14
        ? `Memo is ${staleDays} day(s) old.`
        : `Memo is ${staleDays} day(s) old. Refresh it or capture new signals.`,
    path: memo.relPath,
  });

  for (let i = 0; i < resolutions.length; i += 1) {
    for (let j = i + 1; j < resolutions.length; j += 1) {
      const left = resolutions[i];
      const right = resolutions[j];
      if (!left || !right) continue;
      const similarity = claimSimilarity(left.claim.text, right.claim.text);
      if (similarity > 0.85) {
        add(checks, {
          rule: "memo.claim.duplicate",
          severity: strict ? "error" : "warning",
          ok: false,
          message: `Claims ${left.claim.index} and ${right.claim.index} are ${Math.round(similarity * 100)}% similar.`,
          path: memo.relPath,
          line: right.claim.line,
        });
      }
    }
  }

  if (claims.length > 3) {
    const counter = extractSection(memo.body, "What we are not saying");
    add(checks, {
      rule: "memo.counterevidence",
      severity: "warning",
      ok: Boolean(counter && counter.trim().length > 20),
      message:
        counter && counter.trim().length > 20
          ? "Memo states what the evidence does not support."
          : "Add a 'What we are not saying' section to show the limits of the evidence.",
      path: memo.relPath,
    });
  }

  const next =
    extractSection(memo.body, "What to test next") ??
    extractSection(memo.body, "Next tests") ??
    extractSection(memo.body, "Next test");
  add(checks, {
    rule: "memo.next_test",
    severity: "warning",
    ok: Boolean(next && next.trim().length > 10),
    message:
      next && next.trim().length > 10
        ? "Memo proposes a next test."
        : "Add a 'What to test next' section linking to an experiment.",
    path: memo.relPath,
  });

  const errors = checks.filter((result) => !result.ok && result.severity === "error");
  const warnings = checks.filter((result) => !result.ok && result.severity === "warning");
  const claimsWithReceipts = resolutions.filter(
    (resolution) => resolution.signalIds.length > 0,
  ).length;

  return {
    memo,
    claims: resolutions,
    checks,
    errors,
    warnings,
    ok: errors.length === 0,
    claimCount: claims.length,
    claimsWithReceipts,
    claimCoverage: claims.length === 0 ? 0 : claimsWithReceipts / claims.length,
    receiptIds,
    receiptsUsed: receiptIds.length,
    sourceDiversity: diversity,
    staleDays,
  };
}

function auditSignals(repo: LoadedRepo, checks: CheckResult[]): void {
  const hashOwners = new Map<string, SignalRecord>();
  for (const signal of repo.signals) {
    add(checks, {
      rule: "signal.quote_present",
      severity: "error",
      ok: signal.data.quote.trim().length >= 3,
      message: `${signal.data.id}: quote is empty.`,
      path: signal.relPath,
      signalId: signal.data.id,
    });
    add(checks, {
      rule: "signal.source_present",
      severity: "error",
      ok: hasSource(signal),
      message: `${signal.data.id}: missing source.url or evidence block.`,
      path: signal.relPath,
      signalId: signal.data.id,
    });
    add(checks, {
      rule: "signal.integrity_present",
      severity: "error",
      ok: Boolean(signal.data.integrity?.quote_hash),
      message: `${signal.data.id}: missing integrity.quote_hash. Create signals with \`growthos capture\`.`,
      path: signal.relPath,
      signalId: signal.data.id,
    });
    if (signal.data.integrity?.quote_hash) {
      const { valid } = verifyQuoteHash(
        {
          quote: signal.data.quote,
          url: signal.data.source.url,
          publishedAt: signal.data.source.published_at,
        },
        signal.data.integrity.quote_hash,
      );
      add(checks, {
        rule: "signal.hash_integrity",
        severity: "error",
        ok: valid,
        message: valid
          ? `${signal.data.id}: quote hash is valid.`
          : `${signal.data.id}: quote hash does not match. The quote, URL, or date was edited.`,
        path: signal.relPath,
        signalId: signal.data.id,
      });
      const owner = hashOwners.get(signal.data.integrity.quote_hash);
      if (owner) {
        add(checks, {
          rule: "signal.duplicate_hash",
          severity: "warning",
          ok: false,
          message: `${signal.data.id} duplicates the quote hash of ${owner.data.id}.`,
          path: signal.relPath,
          signalId: signal.data.id,
        });
      } else {
        hashOwners.set(signal.data.integrity.quote_hash, signal);
      }
    }
  }
}

function auditExperiments(repo: LoadedRepo, checks: CheckResult[]): void {
  for (const experiment of repo.experiments) {
    for (const signalId of experiment.data.signal_ids) {
      add(checks, {
        rule: "experiment.signal_resolves",
        severity: "error",
        ok: repo.signalById.has(signalId),
        message: `${experiment.data.id}: linked signal ${signalId} does not resolve.`,
        path: experiment.relPath,
      });
    }
    if (experiment.data.status === "complete") {
      add(checks, {
        rule: "experiment.decision",
        severity: "error",
        ok: Boolean(experiment.data.decision && experiment.data.learning),
        message: `${experiment.data.id}: complete experiment needs a decision and a learning.`,
        path: experiment.relPath,
      });
    }
    if (experiment.data.decision) {
      const hasReceipt = experiment.results.some((result) => Boolean(result.receipt));
      add(checks, {
        rule: "experiment.result_receipt",
        severity: "error",
        ok: hasReceipt,
        message: `${experiment.data.id}: decision recorded without a result receipt.`,
        path: experiment.relPath,
      });
    }
  }
}

function auditJobs(repo: LoadedRepo, checks: CheckResult[]): void {
  for (const expected of EXPECTED_JOB_IDS) {
    add(checks, {
      rule: "job.system_coverage",
      severity: "warning",
      ok: repo.jobById.has(expected),
      message: repo.jobById.has(expected)
        ? `${expected} is defined.`
        : `${expected} is missing from growth/agents/.`,
    });
  }
  for (const job of repo.jobs) {
    add(checks, {
      rule: "job.human_approval",
      severity: job.data.human_approval ? "warning" : "error",
      ok: job.data.human_approval,
      message: job.data.human_approval
        ? `${job.data.id}: human approval required.`
        : `${job.data.id}: must define a human approval point.`,
      path: job.relPath,
    });
  }
}

function auditSecrets(repo: LoadedRepo, checks: CheckResult[]): void {
  const records = [
    ...repo.signals.map((record) => ({ path: record.relPath, raw: record.raw })),
    ...repo.memos.map((record) => ({ path: record.relPath, raw: record.raw })),
    ...repo.experiments.map((record) => ({ path: record.relPath, raw: record.raw })),
    ...repo.jobs.map((record) => ({ path: record.relPath, raw: record.raw })),
  ];
  for (const record of records) {
    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(record.raw)) {
        add(checks, {
          rule: "security.secret",
          severity: "error",
          ok: false,
          message: `${record.path}: possible ${secret.name} committed. Remove it and rotate the key.`,
          path: record.path,
        });
      }
    }
  }
}

export function auditRepo(repo: LoadedRepo, options: AuditOptions = {}): RepoAudit {
  const now = options.now ?? new Date();
  const checks: CheckResult[] = [];

  const memoAudits = repo.memos
    .filter((memo) => !memo.rejected)
    .map((memo) => auditMemo(repo, memo, { ...options, now }));

  const primaryMemo =
    memoAudits.find((audit) => audit.ok) ??
    memoAudits
      .slice()
      .sort((a, b) => b.memo.data.created_at.localeCompare(a.memo.data.created_at))[0] ??
    null;

  auditSignals(repo, checks);
  auditExperiments(repo, checks);
  auditJobs(repo, checks);
  auditSecrets(repo, checks);

  if (repo.signals.length === 0) {
    add(checks, {
      rule: "repo.has_signals",
      severity: "warning",
      ok: false,
      message: "No signals captured yet. Start with `growthos capture`.",
    });
  }

  const allChecks = [...checks, ...memoAudits.flatMap((audit) => audit.checks)];
  const errors = allChecks.filter((result) => !result.ok && result.severity === "error");
  const warnings = allChecks.filter((result) => !result.ok && result.severity === "warning");

  const signalsLast30d = repo.signals.filter(
    (signal) => daysSince(signal.data.captured_at, now) <= 30,
  ).length;
  const activeSignals = repo.signals.filter((signal) => signal.data.status === "active");
  const publicSignals = activeSignals.filter((signal) => signal.data.provenance === "public");
  const syntheticSignals = activeSignals.filter((signal) => signal.data.provenance === "synthetic");
  const channels = [...new Set(activeSignals.map((signal) => signal.data.source.kind))];
  const segments = [
    ...new Set(activeSignals.map((signal) => signal.data.segment).filter(Boolean) as string[]),
  ];
  const learningsLast30d = repo.learnings.filter(
    (learning) => daysSince(new Date(learning.mtime).toISOString(), now) <= 30,
  ).length;

  const stats: RepoStats = {
    signals: repo.signals.length,
    activeSignals: activeSignals.length,
    publicSignals: publicSignals.length,
    internalSignals: activeSignals.filter((signal) => signal.data.provenance === "internal").length,
    syntheticSignals: syntheticSignals.length,
    signalsLast30d,
    channels,
    segments,
    memos: repo.memos.length,
    publishedMemos: repo.memos.filter((memo) => memo.data.status === "published").length,
    draftMemos: repo.memos.filter((memo) => memo.data.status === "draft").length,
    rejectedMemos: repo.memos.filter((memo) => memo.rejected).length,
    claims: primaryMemo?.claimCount ?? 0,
    claimsWithReceipts: primaryMemo?.claimsWithReceipts ?? 0,
    receiptsUsed: primaryMemo?.receiptsUsed ?? 0,
    experiments: repo.experiments.length,
    completeExperiments: repo.experiments.filter((exp) => exp.data.status === "complete").length,
    runningExperiments: repo.experiments.filter((exp) => exp.data.status === "running").length,
    jobs: repo.jobs.length,
    learnings: repo.learnings.length,
    learningsLast30d,
    latestMemoAt: primaryMemo?.memo.data.created_at ?? null,
    cockpitMtime: repo.cockpitMtime,
    proofMtime: repo.proofMtime,
    syntheticShare: activeSignals.length === 0 ? 0 : syntheticSignals.length / activeSignals.length,
    publicShare: activeSignals.length === 0 ? 0 : publicSignals.length / activeSignals.length,
  };

  const errorIssues = repo.issues.filter((issue) => issue.severity === "error");
  const ok = errors.length === 0 && errorIssues.length === 0;

  return {
    repo,
    memoAudits,
    primaryMemo,
    checks: allChecks,
    errors,
    warnings,
    issues: repo.issues,
    stats,
    ok,
  };
}
