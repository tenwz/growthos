import path from "node:path";
import {
  auditRepo,
  badgeFor,
  badgeSvg,
  ensureDir,
  explainScore,
  loadRepo,
  repoPaths,
  requireRepo,
  scoreRepo,
  writeText,
} from "@growthos/core";
import type { Command } from "commander";
import { EXIT } from "../ui/exit-codes.js";
import { hint, line, printJson, success, title } from "../ui/output.js";

interface ScoreOptions {
  json?: boolean;
  explain?: boolean;
  badge?: boolean;
  min?: string;
  root?: string;
}

export function registerScore(program: Command): void {
  program
    .command("score [path]")
    .description("Compute the deterministic Growth OS Score")
    .option("--json", "print machine-readable output", false)
    .option("--explain", "print every check and its points", false)
    .option("--badge", "write badge.json and badge.svg into growth/cockpit/", false)
    .option("--min <score>", "exit code 4 if the score is below this value")
    .option("--root <path>", "repo root")
    .action((target: string | undefined, options: ScoreOptions) => {
      const root = target
        ? path.resolve(target)
        : options.root
          ? path.resolve(options.root)
          : requireRepo();
      const audit = auditRepo(loadRepo(root));
      const score = scoreRepo(audit);

      if (options.badge) {
        const cockpit = repoPaths(root).cockpit;
        ensureDir(cockpit);
        writeText(
          path.join(cockpit, "badge.json"),
          `${JSON.stringify(badgeFor(score), null, 2)}\n`,
        );
        writeText(path.join(cockpit, "badge.svg"), badgeSvg(score));
        if (!options.json) success(`Badge written to ${path.relative(process.cwd(), cockpit)}`);
      }

      if (options.json) {
        printJson(score);
      } else {
        line(title(`Growth OS Score: ${score.score}/100 (${score.tier})`));
        line(
          hint(
            `${score.certified ? "certified" : score.synthetic ? "demo" : "uncertified"} · ${score.stats.activeSignals} active signals · ${score.stats.claimsWithReceipts}/${score.stats.claims} claims with receipts`,
          ),
        );
        if (options.explain) {
          line();
          line(explainScore(score));
        } else {
          const dimensions = [...new Set(score.checks.map((check) => check.dimension))];
          line();
          for (const dimension of dimensions) {
            const checks = score.checks.filter((check) => check.dimension === dimension);
            const earned = checks.reduce((sum, check) => sum + check.earned, 0);
            const points = checks.reduce((sum, check) => sum + check.points, 0);
            line(`  ${dimension.padEnd(24)} ${String(earned).padStart(3)}/${points}`);
          }
          line();
          line(hint("Run with --explain to see every check."));
        }
      }

      const min = options.min ? Number(options.min) : undefined;
      if (min !== undefined && !Number.isNaN(min) && score.score < min) {
        process.exitCode = EXIT.SCORE;
      }
    });
}
