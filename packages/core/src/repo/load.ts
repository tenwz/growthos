import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { parseFrontmatter } from "../markdown/frontmatter.js";
import {
  CONFIG_KEYS,
  ConfigSchema,
  EXPERIMENT_KEYS,
  type Experiment,
  ExperimentSchema,
  type GrowthConfig,
  JOB_KEYS,
  type Job,
  JobSchema,
  MEMO_KEYS,
  type Memo,
  MemoSchema,
  SIGNAL_KEYS,
  type Signal,
  SignalSchema,
  unknownKeys,
} from "../schema/index.js";
import { isDirectory, listFilesRecursive, readText, relativePath } from "../util/fs.js";
import { type RepoPaths, repoPaths } from "./paths.js";

export type IssueSeverity = "error" | "warning";

export interface RepoIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  path?: string;
  line?: number;
}

export interface SignalRecord {
  kind: "signal";
  path: string;
  relPath: string;
  data: Signal;
  body: string;
  raw: string;
  mtime: number;
}

export interface MemoRecord {
  kind: "memo";
  path: string;
  relPath: string;
  data: Memo;
  body: string;
  raw: string;
  mtime: number;
  rejected: boolean;
}

export interface ExperimentRecord {
  kind: "experiment";
  path: string;
  relPath: string;
  dir: string;
  data: Experiment;
  body: string;
  raw: string;
  mtime: number;
  results: ExperimentResult[];
}

export interface ExperimentResult {
  date?: string;
  metric: string;
  value: number;
  receipt?: string;
}

export interface JobRecord {
  kind: "job";
  path: string;
  relPath: string;
  data: Job;
  body: string;
  raw: string;
  mtime: number;
}

export interface MetricRecord {
  path: string;
  relPath: string;
  data: Record<string, unknown>;
  mtime: number;
}

export interface LearningRecord {
  path: string;
  relPath: string;
  body: string;
  data: Record<string, unknown>;
  mtime: number;
}

export interface LoadedRepo {
  root: string;
  paths: RepoPaths;
  config: GrowthConfig | null;
  configError: string | null;
  signals: SignalRecord[];
  memos: MemoRecord[];
  experiments: ExperimentRecord[];
  jobs: JobRecord[];
  metrics: MetricRecord[];
  learnings: LearningRecord[];
  issues: RepoIssue[];
  cockpitMtime: number | null;
  proofMtime: number | null;
  signalById: Map<string, SignalRecord>;
  memoById: Map<string, MemoRecord>;
  experimentById: Map<string, ExperimentRecord>;
  jobById: Map<string, JobRecord>;
}

function formatZodError(error: {
  issues: { path: (string | number)[]; message: string }[];
}): string {
  return error.issues
    .map((issue) => `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`)
    .join("; ");
}

function readMaybe(target: string): string | null {
  try {
    return readText(target);
  } catch {
    return null;
  }
}

function fileMtime(target: string): number | null {
  try {
    return fs.statSync(target).mtimeMs;
  } catch {
    return null;
  }
}

function loadConfig(repo: LoadedRepo): void {
  const raw = readMaybe(repo.paths.config);
  if (raw === null) {
    repo.configError = `Missing ${repo.paths.config}`;
    repo.issues.push({
      severity: "error",
      code: "config.missing",
      message: `Missing config file: ${repo.paths.config}`,
      path: repo.paths.config,
    });
    return;
  }
  try {
    const data = parseYaml(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Config must be a YAML mapping");
    }
    const extra = unknownKeys(data as Record<string, unknown>, CONFIG_KEYS);
    if (extra.length > 0) {
      repo.issues.push({
        severity: "warning",
        code: "config.unknown_keys",
        message: `Unknown config keys: ${extra.join(", ")}`,
        path: repo.paths.config,
      });
    }
    const parsed = ConfigSchema.safeParse(data);
    if (!parsed.success) {
      repo.configError = formatZodError(parsed.error);
      repo.issues.push({
        severity: "error",
        code: "config.invalid",
        message: `Invalid config: ${repo.configError}`,
        path: repo.paths.config,
      });
      return;
    }
    repo.config = parsed.data;
  } catch (error) {
    repo.configError = (error as Error).message;
    repo.issues.push({
      severity: "error",
      code: "config.invalid",
      message: `Invalid config: ${repo.configError}`,
      path: repo.paths.config,
    });
  }
}

function loadSignals(repo: LoadedRepo): void {
  for (const file of listFilesRecursive(repo.paths.signals, [".md"])) {
    const relPath = relativePath(repo.root, file);
    const raw = readMaybe(file) ?? "";
    try {
      const parsed = parseFrontmatter(raw);
      const extra = unknownKeys(parsed.data, SIGNAL_KEYS);
      if (extra.length > 0) {
        repo.issues.push({
          severity: "warning",
          code: "signal.unknown_keys",
          message: `${relPath}: unknown keys: ${extra.join(", ")}`,
          path: file,
        });
      }
      const result = SignalSchema.safeParse(parsed.data);
      if (!result.success) {
        repo.issues.push({
          severity: "error",
          code: "signal.invalid",
          message: `${relPath}: ${formatZodError(result.error)}`,
          path: file,
        });
        continue;
      }
      repo.signals.push({
        kind: "signal",
        path: file,
        relPath,
        data: result.data,
        body: parsed.body,
        raw,
        mtime: fileMtime(file) ?? 0,
      });
    } catch (error) {
      repo.issues.push({
        severity: "error",
        code: "signal.parse_error",
        message: `${relPath}: ${(error as Error).message}`,
        path: file,
      });
    }
  }
  repo.signals.sort((a, b) => b.data.captured_at.localeCompare(a.data.captured_at));
}

function loadMemos(repo: LoadedRepo): void {
  for (const file of listFilesRecursive(repo.paths.memos, [".md"])) {
    const relPath = relativePath(repo.root, file);
    const raw = readMaybe(file) ?? "";
    try {
      const parsed = parseFrontmatter(raw);
      const extra = unknownKeys(parsed.data, MEMO_KEYS);
      if (extra.length > 0) {
        repo.issues.push({
          severity: "warning",
          code: "memo.unknown_keys",
          message: `${relPath}: unknown keys: ${extra.join(", ")}`,
          path: file,
        });
      }
      const result = MemoSchema.safeParse(parsed.data);
      if (!result.success) {
        repo.issues.push({
          severity: "error",
          code: "memo.invalid",
          message: `${relPath}: ${formatZodError(result.error)}`,
          path: file,
        });
        continue;
      }
      repo.memos.push({
        kind: "memo",
        path: file,
        relPath,
        data: result.data,
        body: parsed.body,
        raw,
        mtime: fileMtime(file) ?? 0,
        rejected: result.data.status === "rejected" || relPath.includes("/rejected/"),
      });
    } catch (error) {
      repo.issues.push({
        severity: "error",
        code: "memo.parse_error",
        message: `${relPath}: ${(error as Error).message}`,
        path: file,
      });
    }
  }
  repo.memos.sort((a, b) => b.data.created_at.localeCompare(a.data.created_at));
}

export function parseExperimentResults(body: string): ExperimentResult[] {
  const lines = body.split(/\r?\n/);
  const results: ExperimentResult[] = [];
  let inResults = false;
  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      inResults = (heading[2] ?? "").trim().toLowerCase() === "results";
      continue;
    }
    if (!inResults) continue;
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || /^\|\s*-+/.test(trimmed)) continue;
    if (/^\|\s*date\s*\|/i.test(trimmed)) continue;
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 3) continue;
    const value = Number.parseFloat((cells[2] ?? "").replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(value)) continue;
    results.push({
      date: cells[0] || undefined,
      metric: cells[1] ?? "",
      value,
      receipt: cells[3] || undefined,
    });
  }
  return results;
}

function loadExperiments(repo: LoadedRepo): void {
  const files = listFilesRecursive(repo.paths.experiments, [".md"]).filter((file) =>
    /experiment\.md$|\.exp\.md$/i.test(file),
  );
  for (const file of files) {
    const relPath = relativePath(repo.root, file);
    const raw = readMaybe(file) ?? "";
    try {
      const parsed = parseFrontmatter(raw);
      const extra = unknownKeys(parsed.data, EXPERIMENT_KEYS);
      if (extra.length > 0) {
        repo.issues.push({
          severity: "warning",
          code: "experiment.unknown_keys",
          message: `${relPath}: unknown keys: ${extra.join(", ")}`,
          path: file,
        });
      }
      const result = ExperimentSchema.safeParse(parsed.data);
      if (!result.success) {
        repo.issues.push({
          severity: "error",
          code: "experiment.invalid",
          message: `${relPath}: ${formatZodError(result.error)}`,
          path: file,
        });
        continue;
      }
      repo.experiments.push({
        kind: "experiment",
        path: file,
        relPath,
        dir: path.dirname(file),
        data: result.data,
        body: parsed.body,
        raw,
        mtime: fileMtime(file) ?? 0,
        results: parseExperimentResults(parsed.body),
      });
    } catch (error) {
      repo.issues.push({
        severity: "error",
        code: "experiment.parse_error",
        message: `${relPath}: ${(error as Error).message}`,
        path: file,
      });
    }
  }
  repo.experiments.sort((a, b) => b.data.id.localeCompare(a.data.id));
}

function loadJobs(repo: LoadedRepo): void {
  for (const file of listFilesRecursive(repo.paths.agents, [".md"])) {
    const relPath = relativePath(repo.root, file);
    const raw = readMaybe(file) ?? "";
    try {
      const parsed = parseFrontmatter(raw);
      const extra = unknownKeys(parsed.data, JOB_KEYS);
      if (extra.length > 0) {
        repo.issues.push({
          severity: "warning",
          code: "job.unknown_keys",
          message: `${relPath}: unknown keys: ${extra.join(", ")}`,
          path: file,
        });
      }
      const result = JobSchema.safeParse(parsed.data);
      if (!result.success) {
        repo.issues.push({
          severity: "error",
          code: "job.invalid",
          message: `${relPath}: ${formatZodError(result.error)}`,
          path: file,
        });
        continue;
      }
      repo.jobs.push({
        kind: "job",
        path: file,
        relPath,
        data: result.data,
        body: parsed.body,
        raw,
        mtime: fileMtime(file) ?? 0,
      });
    } catch (error) {
      repo.issues.push({
        severity: "error",
        code: "job.parse_error",
        message: `${relPath}: ${(error as Error).message}`,
        path: file,
      });
    }
  }
  repo.jobs.sort((a, b) => a.data.id.localeCompare(b.data.id));
}

function loadMetrics(repo: LoadedRepo): void {
  for (const file of listFilesRecursive(repo.paths.metrics, [".json"])) {
    const relPath = relativePath(repo.root, file);
    try {
      const parsed = JSON.parse(readMaybe(file) ?? "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("metrics file must be a JSON object");
      }
      repo.metrics.push({
        path: file,
        relPath,
        data: parsed as Record<string, unknown>,
        mtime: fileMtime(file) ?? 0,
      });
    } catch (error) {
      repo.issues.push({
        severity: "warning",
        code: "metrics.invalid",
        message: `${relPath}: ${(error as Error).message}`,
        path: file,
      });
    }
  }
  repo.metrics.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function loadLearnings(repo: LoadedRepo): void {
  for (const file of listFilesRecursive(repo.paths.learnings, [".md"])) {
    const relPath = relativePath(repo.root, file);
    const raw = readMaybe(file) ?? "";
    try {
      const parsed = parseFrontmatter(raw);
      repo.learnings.push({
        path: file,
        relPath,
        body: parsed.body,
        data: parsed.data,
        mtime: fileMtime(file) ?? 0,
      });
    } catch (error) {
      repo.issues.push({
        severity: "warning",
        code: "learning.parse_error",
        message: `${relPath}: ${(error as Error).message}`,
        path: file,
      });
    }
  }
}

export function loadRepo(root: string): LoadedRepo {
  const resolved = path.resolve(root);
  const repo: LoadedRepo = {
    root: resolved,
    paths: repoPaths(resolved),
    config: null,
    configError: null,
    signals: [],
    memos: [],
    experiments: [],
    jobs: [],
    metrics: [],
    learnings: [],
    issues: [],
    cockpitMtime: fileMtime(path.join(repoPaths(resolved).cockpit, "index.html")),
    proofMtime: fileMtime(repoPaths(resolved).proof),
    signalById: new Map(),
    memoById: new Map(),
    experimentById: new Map(),
    jobById: new Map(),
  };

  if (!isDirectory(repo.paths.growth)) {
    repo.issues.push({
      severity: "error",
      code: "growth.missing",
      message: `Missing growth/ directory in ${resolved}`,
      path: repo.paths.growth,
    });
    return repo;
  }

  loadConfig(repo);
  loadSignals(repo);
  loadMemos(repo);
  loadExperiments(repo);
  loadJobs(repo);
  loadMetrics(repo);
  loadLearnings(repo);

  for (const signal of repo.signals) {
    const existing = repo.signalById.get(signal.data.id);
    if (existing) {
      repo.issues.push({
        severity: "error",
        code: "signal.duplicate_id",
        message: `Duplicate signal id ${signal.data.id} in ${existing.relPath} and ${signal.relPath}`,
        path: signal.path,
      });
    } else {
      repo.signalById.set(signal.data.id, signal);
    }
  }
  for (const memo of repo.memos) {
    const existing = repo.memoById.get(memo.data.id);
    if (existing) {
      repo.issues.push({
        severity: "error",
        code: "memo.duplicate_id",
        message: `Duplicate memo id ${memo.data.id} in ${existing.relPath} and ${memo.relPath}`,
        path: memo.path,
      });
    } else {
      repo.memoById.set(memo.data.id, memo);
    }
  }
  for (const experiment of repo.experiments) {
    const existing = repo.experimentById.get(experiment.data.id);
    if (existing) {
      repo.issues.push({
        severity: "error",
        code: "experiment.duplicate_id",
        message: `Duplicate experiment id ${experiment.data.id} in ${existing.relPath} and ${experiment.relPath}`,
        path: experiment.path,
      });
    } else {
      repo.experimentById.set(experiment.data.id, experiment);
    }
  }
  for (const job of repo.jobs) {
    const existing = repo.jobById.get(job.data.id);
    if (existing) {
      repo.issues.push({
        severity: "error",
        code: "job.duplicate_id",
        message: `Duplicate job id ${job.data.id} in ${existing.relPath} and ${job.relPath}`,
        path: job.path,
      });
    } else {
      repo.jobById.set(job.data.id, job);
    }
  }

  return repo;
}
