import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { auditRepo, loadRepo } from "../src/index.js";
import { extractAllSignalIds } from "../src/markdown/citations.js";
import { parseFrontmatter, stringifyFrontmatter } from "../src/markdown/frontmatter.js";
import { readText, writeText } from "../src/util/fs.js";
import { cleanup, requireDefined, tempRepo } from "./helpers.js";

const dirs: string[] = [];

function fixture(): string {
  const dir = tempRepo();
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  while (dirs.length) cleanup(dirs.pop() as string);
});

function rewriteFrontmatter(file: string, mutate: (data: Record<string, unknown>) => void): void {
  const parsed = parseFrontmatter(readText(file));
  const data = parsed.data as Record<string, unknown>;
  mutate(data);
  writeText(file, stringifyFrontmatter(data, parsed.body));
}

describe("auditRepo on the synthetic example", () => {
  it("passes the published memo and fails the draft with the exact claim", () => {
    const dir = fixture();
    const audit = auditRepo(loadRepo(dir));

    expect(audit.primaryMemo?.memo.relPath).toContain("whatthemarketistellingus");
    expect(audit.primaryMemo?.ok).toBe(true);
    expect(audit.primaryMemo?.claimCount).toBe(6);
    expect(audit.primaryMemo?.receiptsUsed).toBe(18);
    expect(audit.primaryMemo?.sourceDiversity).toBe(4);

    const failing = audit.memoAudits.filter((memo) => !memo.ok);
    expect(failing).toHaveLength(1);
    const missing = failing[0]?.errors.find((error) => error.rule === "memo.claim.receipt_count");
    expect(missing?.claim).toContain("AI SDR");
    expect(missing?.message).toContain("no receipt");
  });

  it("counts signals, channels, and synthetic provenance", () => {
    const audit = auditRepo(loadRepo(fixture()));
    expect(audit.stats.activeSignals).toBe(31);
    expect(audit.stats.syntheticSignals).toBe(31);
    expect(audit.stats.channels.length).toBeGreaterThanOrEqual(6);
    expect(audit.stats.jobs).toBe(6);
    expect(audit.stats.completeExperiments).toBe(2);
  });
});

describe("tamper detection", () => {
  it("rejects a signal whose quote was edited after capture", () => {
    const dir = fixture();
    const repo = loadRepo(dir);
    const memo = repo.memos.find((candidate) =>
      candidate.relPath.includes("whatthemarketistellingus"),
    );
    expect(memo).toBeDefined();
    const signalId = extractAllSignalIds(memo?.body ?? "")[0];
    const signal = requireDefined(repo.signalById.get(signalId ?? ""), "signal");

    rewriteFrontmatter(path.join(dir, signal.relPath), (data) => {
      data.quote = "This quote was rewritten by a marketer after the fact.";
    });

    const audit = auditRepo(loadRepo(dir));
    const integrity = audit.checks.find((check) => check.rule === "signal.hash_integrity");
    expect(integrity?.ok).toBe(false);
    expect(audit.ok).toBe(false);
  });

  it("rejects a memo that cites a retracted signal", () => {
    const dir = fixture();
    const repo = loadRepo(dir);
    const memo = requireDefined(
      repo.memos.find((candidate) => candidate.relPath.includes("whatthemarketistellingus")),
      "primary memo",
    );
    const signalId = extractAllSignalIds(memo?.body ?? "")[0];
    const signal = requireDefined(repo.signalById.get(signalId ?? ""), "signal");

    rewriteFrontmatter(path.join(dir, signal.relPath), (data) => {
      data.status = "retracted";
    });
    rewriteFrontmatter(path.join(dir, memo.relPath), (data) => {
      data.status = "published";
      data.published_at = new Date().toISOString();
    });

    const audit = auditRepo(loadRepo(dir));
    const inactive = audit.checks.find((check) => check.rule === "memo.claim.inactive_receipt");
    expect(inactive?.ok).toBe(false);
    expect(audit.ok).toBe(false);
  });

  it("rejects a claim whose only citation was removed", () => {
    const dir = fixture();
    const repo = loadRepo(dir);
    const memo = requireDefined(
      repo.memos.find((candidate) => candidate.relPath.includes("whatthemarketistellingus")),
      "primary memo",
    );
    const file = path.join(dir, memo.relPath);
    const parsed = parseFrontmatter(readText(file));
    const body = parsed.body.replace(/\[@sig_[0-9A-HJKMNP-TV-Z]{26}\]/g, (match, offset) =>
      offset < 400 ? "" : match,
    );
    writeText(file, stringifyFrontmatter(parsed.data, body));

    const audit = auditRepo(loadRepo(dir));
    const missing = audit.memoAudits
      .flatMap((memoAudit) => memoAudit.errors)
      .filter((error) => error.rule === "memo.claim.receipt_count");
    expect(missing.length).toBeGreaterThan(0);
  });
});
