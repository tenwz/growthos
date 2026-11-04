import path from "node:path";
import { auditRepo, loadRepo, requireRepo } from "@growthos/core";
import type { Command } from "commander";
import { EXIT } from "../ui/exit-codes.js";
import { formatCheck, hint, line, printJson, summary, title } from "../ui/output.js";

interface DoctorOptions {
  strict?: boolean;
  json?: boolean;
  root?: string;
}

export function registerDoctor(program: Command): void {
  program
    .command("doctor [path]")
    .description("Validate a Growth OS repo: evidence, hashes, freshness, jobs, experiments")
    .option("--strict", "treat stale memos, low diversity, and duplicated claims as errors", false)
    .option("--json", "print machine-readable output", false)
    .option("--root <path>", "repo root (defaults to the nearest growth/ folder)")
    .action((target: string | undefined, options: DoctorOptions) => {
      const root = target
        ? path.resolve(target)
        : options.root
          ? path.resolve(options.root)
          : requireRepo();
      const repo = loadRepo(root);
      const audit = auditRepo(repo, { strict: options.strict });

      if (options.json) {
        printJson({
          ok: audit.ok,
          root,
          errors: audit.errors,
          warnings: audit.warnings,
          issues: audit.issues,
          stats: audit.stats,
        });
        process.exitCode = audit.ok ? EXIT.OK : EXIT.VALIDATION;
        return;
      }

      line(`${title("growthOS doctor")} ${hint(root)}`);
      const problems = [...audit.errors, ...audit.warnings];
      if (problems.length === 0 && audit.issues.length === 0) {
        line("  ✓ No evidence errors. No warnings.");
      } else {
        for (const issue of audit.issues) {
          const label = issue.severity === "error" ? "[31mFAIL[0m" : "[33mWARN[0m";
          line(`  ${label}  ${issue.message}`);
        }
        for (const check of problems) {
          line(formatCheck(check));
        }
      }
      line();
      line(
        `Summary: ${summary(audit.errors.length + audit.issues.filter((i) => i.severity === "error").length, audit.warnings.length + audit.issues.filter((i) => i.severity === "warning").length)}`,
      );
      line(
        hint(
          `${audit.stats.activeSignals} active signals · ${audit.stats.claims} claims · ${audit.stats.receiptsUsed} receipts · ${audit.stats.experiments} experiments`,
        ),
      );
      process.exitCode = audit.ok ? EXIT.OK : EXIT.VALIDATION;
    });
}
