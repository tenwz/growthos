import path from "node:path";
import {
  auditRepo,
  generateCockpit,
  loadRepo,
  requireRepo,
  scoreRepo,
  writeText,
} from "@growthos/core";
import type { Command } from "commander";
import { hint, line, openFile, success } from "../ui/output.js";

interface CockpitOptions {
  open: boolean;
  theme?: "dark" | "light";
  out?: string;
  root?: string;
}

export function registerCockpit(program: Command): void {
  program
    .command("cockpit")
    .description("Generate a self-contained static cockpit, badge, and share card")
    .option("--no-open", "do not open the cockpit in a browser")
    .option("--theme <theme>", "dark or light")
    .option("--out <file>", "also write the HTML to this file")
    .option("--root <path>", "repo root")
    .action((options: CockpitOptions) => {
      const root = options.root ? path.resolve(options.root) : requireRepo();
      let repo = loadRepo(root);
      let audit = auditRepo(repo);
      let score = scoreRepo(audit);
      generateCockpit(repo, audit, score, { theme: options.theme });

      repo = loadRepo(root);
      audit = auditRepo(repo);
      score = scoreRepo(audit);
      const result = generateCockpit(repo, audit, score, { theme: options.theme });

      if (options.out) {
        const out = path.resolve(options.out);
        writeText(out, result.html);
        success(`Cockpit written to ${path.relative(process.cwd(), out)}`);
      } else {
        success(`Cockpit generated: ${path.relative(process.cwd(), result.htmlPath)}`);
      }
      line(
        hint(
          `Score ${score.score}/100 (${score.tier}) · badge and share card written next to the cockpit.`,
        ),
      );
      if (options.open) openFile(result.htmlPath);
    });
}
