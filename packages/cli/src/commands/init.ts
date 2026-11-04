import fs from "node:fs";
import path from "node:path";
import { copyDir, ensureDir, exists, isDirectory, writeText } from "@growthos/core";
import type { Command } from "commander";
import { assetPath } from "../assets.js";
import { CliError, EXIT } from "../ui/exit-codes.js";
import { hint, line, success, title } from "../ui/output.js";

interface InitOptions {
  template: string;
  agent: string;
  force: boolean;
}

function isEmptyDir(target: string): boolean {
  if (!exists(target)) return true;
  if (!isDirectory(target)) return false;
  return fs.readdirSync(target).filter((entry) => entry !== ".git").length === 0;
}

export function registerInit(program: Command): void {
  program
    .command("init [dir]")
    .description("Scaffold a new Growth OS repo")
    .option("--template <template>", "base or hvac-saas", "base")
    .option("--agent <agent>", "claude-code, codex, cursor, all, none", "all")
    .option("--force", "write into a non-empty directory", false)
    .action((dir: string | undefined, options: InitOptions) => {
      const target = path.resolve(dir ?? ".");
      if (!isEmptyDir(target) && !options.force) {
        throw new CliError(
          `Directory is not empty: ${target}\nUse --force to write into it anyway.`,
          EXIT.USAGE,
        );
      }
      const template = options.template === "hvac-saas" ? "examples/hvac-saas" : "templates/base";
      const source = assetPath(...template.split("/"));
      ensureDir(target);
      copyDir(source, target);

      if (options.agent === "cursor" || options.agent === "all") {
        const rules = path.join(target, ".cursor", "rules");
        ensureDir(rules);
        writeText(
          path.join(rules, "growthos.mdc"),
          `---
description: growthOS evidence rules
alwaysApply: true
---

- Read AGENTS.md before writing.
- Every memo claim needs a [@sig_...] receipt.
- Never invent a quote, URL, customer, number, or date.
- Agents draft; humans publish and send.
`,
        );
      }
      if (options.agent === "none") {
        for (const file of ["AGENTS.md", "CLAUDE.md"]) {
          const targetFile = path.join(target, file);
          if (exists(targetFile)) fs.rmSync(targetFile);
        }
      }

      const name = path.basename(target);
      line();
      success(`Growth OS created at ${target}`);
      line();
      line(title("Next"));
      line(`  cd ${hint(path.relative(process.cwd(), target) || ".")}`);
      line('  npx growthos capture --source x --url <url> --quote "<verbatim quote>"');
      line("  npx growthos task compile customer-truth --since 7d");
      line("  npx growthos doctor --strict");
      line("  npx growthos score --explain");
      line("  npx growthos cockpit --open");
      line();
      line(hint(`Repo name: ${name}. Edit .growthos/config.yaml and growth/company.md first.`));
    });
}
