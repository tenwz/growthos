import path from "node:path";
import type { z } from "zod";
import { parseFrontmatter, stringifyFrontmatter } from "../markdown/frontmatter.js";
import { type LoadedRepo, loadRepo, parseExperimentResults } from "../repo/load.js";
import { repoPaths } from "../repo/paths.js";
import type { DecisionSchema } from "../schema/common.js";
import type { Experiment, PrimaryMetricSchema } from "../schema/experiment.js";
import { ExperimentSchema } from "../schema/experiment.js";
import { isoDate, nowIso } from "../util/dates.js";
import { ensureDir, exists, readText, writeText } from "../util/fs.js";
import { newId } from "../util/ids.js";

export interface CreateExperimentInput {
  hypothesis: string;
  signalIds?: string[];
  channel: string;
  audience?: string;
  primaryMetric: z.infer<typeof PrimaryMetricSchema>;
  guardrails?: string[];
  owner?: string;
  startAt?: string;
  endAt?: string;
}

export interface ExperimentResultInput {
  metric: string;
  value: number;
  source: string;
  date?: string;
}

export type Decision = z.infer<typeof DecisionSchema>;

function experimentBody(experiment: Experiment): string {
  return `## Design

${experiment.hypothesis}

- Channel: ${experiment.channel}
- Audience: ${experiment.audience ?? "not specified"}
- Guardrails: ${experiment.guardrails.length ? experiment.guardrails.join(", ") : "none"}

## Asset

See \`asset.md\`.

## Results

| Date | Metric | Value | Receipt |
| --- | --- | --- | --- |
`;
}

export function createExperiment(
  root: string,
  input: CreateExperimentInput,
): { experiment: Experiment; dir: string; file: string } {
  const repo = loadRepo(root);
  const id = newId("exp");
  const signalIds = input.signalIds ?? [];
  for (const signalId of signalIds) {
    if (!repo.signalById.has(signalId)) {
      throw new Error(`Signal ${signalId} does not exist.`);
    }
  }
  const experiment = ExperimentSchema.parse({
    schema: "growthos/experiment@1",
    id,
    status: "proposed",
    hypothesis: input.hypothesis,
    signal_ids: signalIds,
    channel: input.channel,
    audience: input.audience,
    owner: input.owner ?? "human",
    start_at: input.startAt ?? nowIso(),
    end_at: input.endAt,
    primary_metric: input.primaryMetric,
    guardrails: input.guardrails ?? [],
    decision: null,
    learning: null,
  });
  const dir = path.join(repoPaths(root).experiments, id);
  ensureDir(dir);
  const file = path.join(dir, "experiment.md");
  writeText(
    file,
    stringifyFrontmatter(
      experiment as unknown as Record<string, unknown>,
      experimentBody(experiment),
    ),
  );
  writeText(path.join(dir, "asset.md"), `# Asset\n\nDescribe or link the asset for ${id}.\n`);
  return { experiment, dir, file };
}

function replaceResultSection(body: string, row: string): string {
  const resultsHeader = "## Results";
  if (!body.includes(resultsHeader)) {
    return `${body.trimEnd()}\n\n${resultsHeader}\n\n| Date | Metric | Value | Receipt |\n| --- | --- | --- | --- |\n${row}\n`;
  }
  const lines = body.split(/\r?\n/);
  let inResults = false;
  let lastTableLine = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      if (inResults && (heading[1] ?? "").length <= 2) break;
      if ((heading[2] ?? "").trim().toLowerCase() === "results") inResults = true;
      continue;
    }
    if (inResults && line.trim().startsWith("|")) lastTableLine = i;
  }
  if (lastTableLine === -1) {
    const index = lines.findIndex((line) => line.trim().toLowerCase() === "## results");
    lines.splice(
      index + 1,
      0,
      "",
      "| Date | Metric | Value | Receipt |",
      "| --- | --- | --- | --- |",
      row,
    );
  } else {
    lines.splice(lastTableLine + 1, 0, row);
  }
  return lines.join("\n");
}

export function logExperimentResult(
  root: string,
  experimentId: string,
  input: ExperimentResultInput,
): { experiment: Experiment; file: string } {
  const file = path.join(repoPaths(root).experiments, experimentId, "experiment.md");
  if (!exists(file)) throw new Error(`Experiment ${experimentId} not found.`);
  if (!input.source.trim())
    throw new Error("A result receipt (source URL or file path) is required.");
  const parsed = parseFrontmatter(readText(file));
  const experiment = ExperimentSchema.parse(parsed.data);
  const row = `| ${input.date ?? isoDate()} | ${input.metric.replace(/\|/g, "\\|")} | ${input.value} | ${input.source.replace(/\|/g, "\\|")} |`;
  const body = replaceResultSection(parsed.body, row);
  const updated: Experiment = {
    ...experiment,
    status: experiment.status === "proposed" ? "running" : experiment.status,
    primary_metric: { ...experiment.primary_metric, observed: input.value },
  };
  writeText(file, stringifyFrontmatter(updated as unknown as Record<string, unknown>, body));
  return { experiment: updated, file };
}

export function decideExperiment(
  root: string,
  experimentId: string,
  decision: Decision,
  learning: string,
): { experiment: Experiment; file: string; learningFile: string } {
  const file = path.join(repoPaths(root).experiments, experimentId, "experiment.md");
  if (!exists(file)) throw new Error(`Experiment ${experimentId} not found.`);
  if (!learning.trim()) throw new Error("A written learning is required.");
  const parsed = parseFrontmatter(readText(file));
  const experiment = ExperimentSchema.parse(parsed.data);
  const results = parseExperimentResults(parsed.body);
  if (!results.some((result) => Boolean(result.receipt))) {
    throw new Error(
      "Cannot decide without a result that has a receipt. Run `growthos experiment log` with --source first.",
    );
  }
  const updated: Experiment = {
    ...experiment,
    status: "complete",
    decision,
    learning,
  };
  writeText(file, stringifyFrontmatter(updated as unknown as Record<string, unknown>, parsed.body));

  const learningsDir = repoPaths(root).learnings;
  ensureDir(learningsDir);
  const learningFile = path.join(learningsDir, `${experimentId}.md`);
  writeText(
    learningFile,
    stringifyFrontmatter(
      {
        schema: "growthos/learning@1",
        experiment: experimentId,
        decision,
        created_at: nowIso(),
      },
      `# Learning — ${experiment.hypothesis}\n\n**Decision:** ${decision}\n\n${learning}\n`,
    ),
  );
  return { experiment: updated, file, learningFile };
}

export function listExperiments(repo: LoadedRepo = loadRepo(process.cwd())) {
  return repo.experiments.map((record) => ({
    id: record.data.id,
    status: record.data.status,
    hypothesis: record.data.hypothesis,
    channel: record.data.channel,
    metric: record.data.primary_metric.name,
    target: record.data.primary_metric.target ?? null,
    observed: record.data.primary_metric.observed ?? null,
    decision: record.data.decision,
    results: record.results.length,
  }));
}
