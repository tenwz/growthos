import path from "node:path";
import {
  type MemoAudit,
  auditRepo,
  copyDir,
  generateCockpit,
  loadRepo,
  markdownToPlain,
  removeDir,
  scoreRepo,
} from "@growthos/core";
import type { Command } from "commander";
import pc from "picocolors";
import { assetPath } from "../assets.js";
import { hint, line, openFile, printBanner, printJson } from "../ui/output.js";
import { VERSION } from "../version.js";

interface DemoOptions {
  dir: string;
  open: boolean;
  json?: boolean;
}

function firstClaimError(
  audit: MemoAudit,
): { index: number; claim: string; message: string } | null {
  const error = audit.errors.find((result) => Boolean(result.claim));
  if (!error?.claim) return null;
  const index =
    audit.claims.find((resolution) => resolution.claim.text === error.claim)?.claim.index ?? 1;
  return { index, claim: error.claim, message: error.message };
}

export function registerDemo(program: Command): void {
  program
    .command("demo")
    .description("Create a complete sample Growth OS, audit it, and open the cockpit")
    .option("--dir <dir>", "target directory", "growthos-demo")
    .option("--no-open", "do not open the cockpit in a browser")
    .option("--json", "print machine-readable output", false)
    .action((options: DemoOptions) => {
      const target = path.resolve(options.dir);
      removeDir(target);
      copyDir(assetPath("examples", "hvac-saas"), target);

      const repo = loadRepo(target);
      const audit = auditRepo(repo);
      let score = scoreRepo(audit);
      generateCockpit(repo, audit, score);
      const refreshed = loadRepo(target);
      const refreshedAudit = auditRepo(refreshed);
      score = scoreRepo(refreshedAudit);
      const cockpit = generateCockpit(refreshed, refreshedAudit, score);

      const memoAudits = [...audit.memoAudits].sort((a, b) =>
        a.memo.data.created_at.localeCompare(b.memo.data.created_at),
      );
      const passing = memoAudits.filter((memo) => memo.ok).length;
      const failing = memoAudits.length - passing;

      if (options.json) {
        printJson({
          ok: true,
          dir: target,
          score: score.score,
          tier: score.tier,
          cockpit: cockpit.htmlPath,
          memos: memoAudits.map((memo) => ({
            path: memo.memo.relPath,
            ok: memo.ok,
            claims: memo.claimCount,
            receipts: memo.receiptsUsed,
            channels: memo.sourceDiversity,
            errors: memo.errors.map((error) => error.message),
          })),
        });
        return;
      }

      printBanner(VERSION);
      line();
      line(`Auditing ${memoAudits.length} memos...`);
      for (const memo of memoAudits) {
        if (memo.ok) {
          line(`  ${pc.green("PASS")}  ${memo.memo.relPath}`);
          line(
            `        ${memo.claimCount} claims, ${memo.receiptsUsed} receipts, ${memo.sourceDiversity} channels.`,
          );
        } else {
          line(`  ${pc.red("FAIL")}  ${memo.memo.relPath}`);
          const error = firstClaimError(memo);
          if (error) {
            line(`        Claim ${error.index}: "${markdownToPlain(error.claim)}"`);
            line(`        ${error.message}`);
          } else {
            const first = memo.errors[0];
            if (first) line(`        ${first.message}`);
          }
        }
      }
      line();
      line(`Growth OS Score: ${score.score}/100 (${score.tier})`);
      line(`Cockpit: ${path.relative(process.cwd(), cockpit.htmlPath)}`);
      line(hint(`${passing} passing · ${failing} failing · ${score.stats.activeSignals} signals`));

      if (options.open) {
        openFile(cockpit.htmlPath);
      }
    });
}
