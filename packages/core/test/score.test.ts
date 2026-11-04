import { afterEach, describe, expect, it } from "vitest";
import { auditRepo, generateCockpit, loadRepo, scoreRepo } from "../src/index.js";
import { cleanup, tempRepo } from "./helpers.js";

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) cleanup(dirs.pop() as string);
});

describe("Growth OS Score", () => {
  it("scores the example at 88 after the cockpit exists", () => {
    const dir = tempRepo();
    dirs.push(dir);
    let repo = loadRepo(dir);
    let audit = auditRepo(repo);
    generateCockpit(repo, audit, scoreRepo(audit));
    repo = loadRepo(dir);
    audit = auditRepo(repo);
    const score = scoreRepo(audit);

    expect(score.score).toBe(88);
    expect(score.tier).toBe("System");
    expect(score.synthetic).toBe(true);
    expect(score.certified).toBe(false);
    expect(score.checks.reduce((sum, check) => sum + check.earned, 0)).toBe(88);
  });

  it("is deterministic across runs", () => {
    const dir = tempRepo();
    dirs.push(dir);
    const first = scoreRepo(auditRepo(loadRepo(dir)));
    const second = scoreRepo(auditRepo(loadRepo(dir)));
    expect(second.score).toBe(first.score);
    expect(second.checks.map((check) => [check.id, check.earned])).toEqual(
      first.checks.map((check) => [check.id, check.earned]),
    );
  });

  it("does not certify synthetic signals", () => {
    const dir = tempRepo();
    dirs.push(dir);
    const score = scoreRepo(auditRepo(loadRepo(dir)));
    expect(score.synthetic).toBe(true);
    expect(score.certified).toBe(false);
  });
});
