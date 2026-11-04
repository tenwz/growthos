import path from "node:path";
import { auditRepo, loadRepo, requireRepo, scoreRepo } from "@growthos/core";
import type { Command } from "commander";
import { hint, line, printJson, title } from "../ui/output.js";

interface StatusOptions {
  json?: boolean;
  root?: string;
}

export function registerStatus(program: Command): void {
  program
    .command("status")
    .description("Show repo health, counts, and the current Growth OS Score")
    .option("--json", "print machine-readable output", false)
    .option("--root <path>", "repo root")
    .action((options: StatusOptions) => {
      const root = options.root ? path.resolve(options.root) : requireRepo();
      const repo = loadRepo(root);
      const audit = auditRepo(repo);
      const score = scoreRepo(audit);

      if (options.json) {
        printJson({
          root,
          ok: audit.ok,
          score: score.score,
          tier: score.tier,
          certified: score.certified,
          stats: audit.stats,
          errors: audit.errors.length,
          warnings: audit.warnings.length,
        });
        return;
      }

      line(title(`growthOS status · ${repo.config?.repo.name ?? path.basename(root)}`));
      line(hint(root));
      line();
      line(
        `  signals      ${audit.stats.activeSignals} active · ${audit.stats.signalsLast30d} in 30d · ${audit.stats.channels.length} channels`,
      );
      line(
        `  segments     ${audit.stats.segments.length} · ${audit.stats.syntheticSignals} synthetic`,
      );
      line(`  memo         ${audit.primaryMemo?.memo.relPath ?? "none"}`);
      line(
        `  claims       ${audit.stats.claims} (${audit.stats.claimsWithReceipts} with receipts)`,
      );
      line(
        `  experiments  ${audit.stats.experiments} · ${audit.stats.completeExperiments} closed · ${audit.stats.runningExperiments} running`,
      );
      line(`  jobs         ${audit.stats.jobs}`);
      line(
        `  score        ${score.score}/100 (${score.tier})${score.certified ? " · certified" : ""}`,
      );
      line(`  evidence     ${audit.errors.length} error(s), ${audit.warnings.length} warning(s)`);
    });
}
