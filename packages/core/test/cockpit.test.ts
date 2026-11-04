import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { auditRepo, generateCockpit, loadRepo, scoreRepo } from "../src/index.js";
import { cleanup, tempRepo } from "./helpers.js";

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) cleanup(dirs.pop() as string);
});

function build() {
  const dir = tempRepo();
  dirs.push(dir);
  let repo = loadRepo(dir);
  let audit = auditRepo(repo);
  generateCockpit(repo, audit, scoreRepo(audit));
  repo = loadRepo(dir);
  audit = auditRepo(repo);
  return generateCockpit(repo, audit, scoreRepo(audit));
}

describe("cockpit", () => {
  it("writes a self-contained HTML file with the score", () => {
    const result = build();
    const html = readFileSync(result.htmlPath, "utf8");
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Growth OS Score");
    expect(html).toContain("88");
    expect(html).toContain("<svg");
  });

  it("makes no external network requests", () => {
    const html = readFileSync(build().htmlPath, "utf8");
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
    expect(html).not.toMatch(/@import\s+url/i);
    expect(html).not.toMatch(/<img[^>]+src=["']https?:/i);
    expect(html).not.toMatch(/fonts\.googleapis/i);
  });

  it("emits a shields-compatible badge", () => {
    const result = build();
    const badge = JSON.parse(readFileSync(result.badgeJsonPath, "utf8")) as Record<string, unknown>;
    expect(badge.schemaVersion).toBe(1);
    expect(badge.label).toBe("growthOS demo");
    expect(String(badge.message)).toContain("88/100");
  });
});
