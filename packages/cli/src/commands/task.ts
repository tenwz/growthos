import path from "node:path";
import { compileTask, loadRepo, requireRepo, runTask } from "@growthos/core";
import type { Command } from "commander";
import { CliError, EXIT } from "../ui/exit-codes.js";
import { hint, line, printJson, success, title } from "../ui/output.js";

interface TaskOptions {
  root?: string;
  since?: string;
  segment?: string;
  tag?: string;
  maxSignals?: string;
  json?: boolean;
}

interface RunOptions extends TaskOptions {
  provider?: string;
  model?: string;
  apply?: boolean;
}

function rootFor(options: { root?: string }): string {
  return options.root ? path.resolve(options.root) : requireRepo();
}

export function registerTask(program: Command): void {
  const task = program.command("task").description("Compile and run agent jobs");

  task
    .command("list")
    .description("List the job specs in growth/agents/")
    .option("--root <path>", "repo root")
    .option("--json", "print machine-readable output", false)
    .action((options: TaskOptions) => {
      const repo = loadRepo(rootFor(options));
      if (options.json) {
        printJson(
          repo.jobs.map((job) => ({
            id: job.data.id,
            name: job.data.name,
            schedule: job.data.schedule,
            outputs: job.data.outputs,
            approval: job.data.human_approval,
            file: job.relPath,
          })),
        );
        return;
      }
      line(title("Agent jobs"));
      for (const job of repo.jobs) {
        line(`  ${job.data.id.padEnd(26)} ${job.data.name}`);
        line(
          hint(
            `    ${job.data.schedule} · ${job.data.outputs.map((output) => output.path).join(", ")}`,
          ),
        );
      }
      if (repo.jobs.length === 0) line("  No jobs found. Run `growthos init` to scaffold them.");
    });

  task
    .command("compile <job>")
    .description("Build the prompt, context, and output contract for a job")
    .option("--root <path>", "repo root")
    .option("--since <since>", "7d or an ISO date")
    .option("--segment <segment>", "filter signals by segment")
    .option("--tag <tag>", "filter signals by tag")
    .option("--max-signals <n>", "cap the number of signals", "40")
    .option("--json", "print machine-readable output", false)
    .action((jobId: string, options: TaskOptions) => {
      const repo = loadRepo(rootFor(options));
      const compiled = compileTask(repo, jobId, {
        since: options.since,
        segment: options.segment,
        tag: options.tag,
        maxSignals: options.maxSignals ? Number(options.maxSignals) : 40,
      });
      if (options.json) {
        printJson(compiled.manifest);
        return;
      }
      success(`Compiled ${compiled.job.data.id}`);
      line(`  run       ${path.relative(process.cwd(), compiled.runDir)}`);
      line(
        `  signals   ${compiled.manifest.signal_count}${compiled.manifest.below_min_signals ? " (below min_signals)" : ""}`,
      );
      line(`  prompt    ${path.relative(process.cwd(), path.join(compiled.runDir, "prompt.md"))}`);
      line(`  output    ${compiled.outputPaths.join(", ")}`);
      line();
      line(hint("Next: `growthos task run <job> --apply` or paste prompt.md into your agent."));
    });

  task
    .command("run <job>")
    .description("Compile a job, call the provider, validate the output, and optionally apply it")
    .option("--root <path>", "repo root")
    .option("--since <since>", "7d or an ISO date")
    .option("--segment <segment>", "filter signals by segment")
    .option("--tag <tag>", "filter signals by tag")
    .option("--max-signals <n>", "cap the number of signals", "40")
    .option("--provider <provider>", "command or openai-compatible")
    .option("--model <model>", "model override")
    .option("--apply", "write the output back into the repo", false)
    .option("--json", "print machine-readable output", false)
    .action(async (jobId: string, options: RunOptions) => {
      const root = rootFor(options);
      try {
        const result = await runTask(root, jobId, {
          since: options.since,
          segment: options.segment,
          tag: options.tag,
          maxSignals: options.maxSignals ? Number(options.maxSignals) : 40,
          providerId: options.provider,
          model: options.model,
          apply: options.apply,
        });
        if (options.json) {
          printJson({
            run_id: result.task.runId,
            run_dir: result.task.runDir,
            blocks: result.blocks.map((block) => block.path),
            written: result.applyResult.written,
            skipped: result.applyResult.skipped,
            applied: result.applied,
          });
          return;
        }
        success(`${result.applied ? "Applied" : "Drafted"} ${result.blocks.length} file(s)`);
        line(`  run       ${path.relative(process.cwd(), result.task.runDir)}`);
        for (const block of result.blocks) {
          line(`  ${result.applied ? "wrote" : "would write"}  ${block.path}`);
        }
        for (const skipped of result.applyResult.skipped) {
          line(`  skipped   ${skipped.path}: ${skipped.reason}`);
        }
        if (!result.applied) {
          line();
          line(hint("Re-run with --apply to write the output into the repo."));
        }
      } catch (error) {
        throw new CliError((error as Error).message, EXIT.PROVIDER);
      }
    });
}
