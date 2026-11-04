import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../../..");
const CLI = path.join(ROOT, "packages/cli/src/index.ts");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "growthos-e2e-"));
const target = path.join(dir, "demo");

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function run(...args: string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", CLI, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
}

describe("growthos demo", () => {
  it("prints the failing claim, the passing memo, and the score", () => {
    const result = run("demo", "--no-open", "--dir", target);
    expect(result.status).toBe(0);
    const output = result.stdout;
    expect(output).toContain("FAIL");
    expect(output).toContain("Claim 2");
    expect(output).toContain("HVAC owners want an AI SDR.");
    expect(output.toLowerCase()).toContain("no receipt");
    expect(output).toContain("PASS");
    expect(output).toContain("6 claims, 18 receipts, 4 channels.");
    expect(output).toContain("Growth OS Score: 88/100 (System)");
    expect(fs.existsSync(path.join(target, "growth/cockpit/index.html"))).toBe(true);
  });

  it("is machine-readable with --json", () => {
    const result = run("demo", "--no-open", "--json", "--dir", target);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      score: number;
      tier: string;
      memos: { ok: boolean; path: string }[];
    };
    expect(payload.score).toBe(88);
    expect(payload.tier).toBe("System");
    expect(payload.memos.filter((memo) => memo.ok)).toHaveLength(1);
    expect(payload.memos.filter((memo) => !memo.ok)).toHaveLength(1);
  });
});
