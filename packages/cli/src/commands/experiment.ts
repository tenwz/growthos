import path from "node:path";
import {
  DecisionSchema,
  createExperiment,
  decideExperiment,
  listExperiments,
  loadRepo,
  logExperimentResult,
  requireRepo,
} from "@growthos/core";
import type { Command } from "commander";
import { CliError, EXIT } from "../ui/exit-codes.js";
import { hint, line, printJson, success, title } from "../ui/output.js";

interface CommonOptions {
  root?: string;
  json?: boolean;
}

function collect(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

function rootFor(options: CommonOptions): string {
  return options.root ? path.resolve(options.root) : requireRepo();
}

interface NewOptions extends CommonOptions {
  hypothesis: string;
  channel: string;
  metric: string;
  signal: string[];
  audience?: string;
  baseline?: string;
  target?: string;
  guardrail: string[];
  owner?: string;
  endAt?: string;
}

interface LogOptions extends CommonOptions {
  metric: string;
  value: string;
  source: string;
  date?: string;
}

interface DecideOptions extends CommonOptions {
  decision: string;
  learning: string;
}

function numberOrUndefined(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new CliError(`"${value}" is not a number.`, EXIT.USAGE);
  }
  return parsed;
}

export function registerExperiment(program: Command): void {
  const experiment = program
    .command("experiment")
    .description("Hypothesis → metric receipt → decision → learning");

  experiment
    .command("new")
    .description("Create an experiment tied to the signals that motivated it")
    .requiredOption("--hypothesis <text>", "falsifiable hypothesis")
    .requiredOption("--channel <channel>", "channel or system under test")
    .requiredOption("--metric <name>", "primary metric name")
    .option("--signal <id>", "signal ID that motivates the test (repeatable)", collect, [])
    .option("--audience <audience>", "target audience")
    .option("--baseline <number>", "baseline value")
    .option("--target <number>", "target value")
    .option("--guardrail <text>", "guardrail metric (repeatable)", collect, [])
    .option("--owner <owner>", "experiment owner", "human")
    .option("--end-at <timestamp>", "planned end timestamp")
    .option("--root <path>", "repo root")
    .option("--json", "print machine-readable output", false)
    .action((options: NewOptions) => {
      const root = rootFor(options);
      const created = createExperiment(root, {
        hypothesis: options.hypothesis,
        signalIds: options.signal,
        channel: options.channel,
        audience: options.audience,
        primaryMetric: {
          name: options.metric,
          baseline: numberOrUndefined(options.baseline) ?? null,
          target: numberOrUndefined(options.target) ?? null,
          observed: null,
        },
        guardrails: options.guardrail,
        owner: options.owner,
        endAt: options.endAt,
      });
      if (options.json) {
        printJson({
          id: created.experiment.id,
          file: path.relative(process.cwd(), created.file),
        });
        return;
      }
      success(`Created ${created.experiment.id}`);
      line(`  file      ${path.relative(process.cwd(), created.file)}`);
      line(
        `  metric    ${created.experiment.primary_metric.name} (baseline ${created.experiment.primary_metric.baseline ?? "?"} → target ${created.experiment.primary_metric.target ?? "?"})`,
      );
      line();
      line(
        hint(
          `Log a result with a receipt, then decide: growthos experiment log ${created.experiment.id} --metric ${options.metric} --value 12 --source <url>`,
        ),
      );
    });

  experiment
    .command("list")
    .description("List experiments and their current state")
    .option("--root <path>", "repo root")
    .option("--json", "print machine-readable output", false)
    .action((options: CommonOptions) => {
      const experiments = listExperiments(loadRepo(rootFor(options)));
      if (options.json) {
        printJson(experiments);
        return;
      }
      line(title("Experiments"));
      for (const item of experiments) {
        const observed = item.observed === null ? "—" : String(item.observed);
        line(
          `  ${item.id}  ${item.status.padEnd(10)} ${item.metric} ${item.target === null ? "" : `target ${item.target} `}observed ${observed}`,
        );
        line(hint(`    ${item.hypothesis}`));
      }
      if (experiments.length === 0) line("  No experiments yet.");
    });

  experiment
    .command("log <id>")
    .description("Append a metric result. A receipt is mandatory.")
    .requiredOption("--metric <name>", "metric name")
    .requiredOption("--value <number>", "observed value")
    .requiredOption("--source <source>", "receipt: public URL or file path")
    .option("--date <date>", "YYYY-MM-DD (defaults to today)")
    .option("--root <path>", "repo root")
    .option("--json", "print machine-readable output", false)
    .action((id: string, options: LogOptions) => {
      const value = numberOrUndefined(options.value);
      if (value === undefined) throw new CliError("--value is required.", EXIT.USAGE);
      const result = logExperimentResult(rootFor(options), id, {
        metric: options.metric,
        value,
        source: options.source,
        date: options.date,
      });
      if (options.json) {
        printJson({
          id,
          status: result.experiment.status,
          observed: result.experiment.primary_metric.observed,
        });
        return;
      }
      success(`Logged ${options.metric}=${value} for ${id}`);
      line(
        hint(
          `Status: ${result.experiment.status}. Decide with: growthos experiment decide ${id} --decision <scale|iterate|kill|inconclusive> --learning "..."`,
        ),
      );
    });

  experiment
    .command("decide <id>")
    .description("Close an experiment with a decision and a written learning")
    .requiredOption("--decision <decision>", "scale, iterate, kill, or inconclusive")
    .requiredOption("--learning <text>", "what the result teaches")
    .option("--root <path>", "repo root")
    .option("--json", "print machine-readable output", false)
    .action((id: string, options: DecideOptions) => {
      const decision = DecisionSchema.safeParse(options.decision);
      if (!decision.success) {
        throw new CliError(
          `Unknown decision "${options.decision}". Use scale, iterate, kill, or inconclusive.`,
          EXIT.USAGE,
        );
      }
      const result = decideExperiment(rootFor(options), id, decision.data, options.learning);
      if (options.json) {
        printJson({
          id,
          decision: result.experiment.decision,
          learning_file: path.relative(process.cwd(), result.learningFile),
        });
        return;
      }
      success(`${id} → ${result.experiment.decision}`);
      line(`  learning  ${path.relative(process.cwd(), result.learningFile)}`);
    });
}
