/**
 * Validates the shipped example repos. Used in CI.
 * Run with: pnpm validate:fixtures
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditRepo, loadRepo, markdownToPlain } from "../packages/core/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(root, "examples", "hvac-saas");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "growthos-fixtures-"));
let failures = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

try {
  const copy = path.join(tmp, "example");
  fs.cpSync(example, copy, { recursive: true });

  const audit = auditRepo(loadRepo(copy));
  check(
    "example has 31 active signals",
    audit.stats.activeSignals === 31,
    String(audit.stats.activeSignals),
  );
  check("example has six job specs", audit.stats.jobs === 6, String(audit.stats.jobs));
  check("primary memo passes", Boolean(audit.primaryMemo?.ok));
  check("primary memo has six claims", audit.primaryMemo?.claimCount === 6);
  check("primary memo has 18 receipts", audit.primaryMemo?.receiptsUsed === 18);

  const failing = audit.memoAudits.filter((memo) => !memo.ok);
  check("exactly one memo fails", failing.length === 1, String(failing.length));
  const claim = failing[0]?.errors.find(
    (error) => error.rule === "memo.claim.receipt_count",
  )?.claim;
  check(
    "failing claim is the AI SDR claim",
    markdownToPlain(claim ?? "").includes("HVAC owners want an AI SDR."),
    claim ?? "missing",
  );

  const strict = path.join(tmp, "valid");
  fs.cpSync(example, strict, { recursive: true });
  fs.rmSync(path.join(strict, "growth", "memos", "2026-11-03-draft-missed-call-ai.md"));
  const strictAudit = auditRepo(loadRepo(strict), { strict: true });
  check(
    "example passes strict audit once the bad draft is removed",
    strictAudit.ok,
    `${strictAudit.errors.length} error(s)`,
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} fixture check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll fixture checks passed.");
}
