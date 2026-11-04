import { afterEach, describe, expect, it } from "vitest";
import {
  createExperiment,
  decideExperiment,
  listExperiments,
  loadRepo,
  logExperimentResult,
  parseExperimentResults,
} from "../src/index.js";
import { readText } from "../src/util/fs.js";
import { cleanup, requireDefined, tempRepo } from "./helpers.js";

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) cleanup(dirs.pop() as string);
});

function repo(): string {
  const dir = tempRepo();
  dirs.push(dir);
  return dir;
}

describe("experiment ledger", () => {
  it("refuses a signal that does not exist", () => {
    expect(() =>
      createExperiment(repo(), {
        hypothesis: "A pricing calculator will increase qualified demos within two weeks.",
        channel: "landing-page",
        signalIds: ["sig_01J8ZQ9V6K4M2N8P3R5T7W9X1Y"],
        primaryMetric: { name: "demos", target: 10 },
      }),
    ).toThrow(/does not exist/);
  });

  it("runs hypothesis → receipted result → decision → learning", () => {
    const dir = repo();
    const loaded = loadRepo(dir);
    const signal = requireDefined(loaded.signals[0], "first signal");
    const created = createExperiment(dir, {
      hypothesis: "A missed-call calculator will increase qualified demos within two weeks.",
      channel: "landing-page",
      signalIds: [signal.data.id],
      primaryMetric: { name: "demos", baseline: 6, target: 25 },
    });

    expect(created.experiment.status).toBe("proposed");

    const logged = logExperimentResult(dir, created.experiment.id, {
      metric: "demos",
      value: 9,
      source: "growth/metrics/2026-w46.json",
    });
    expect(logged.experiment.status).toBe("running");
    expect(logged.experiment.primary_metric.observed).toBe(9);

    const results = parseExperimentResults(readText(logged.file));
    expect(results.at(-1)?.receipt).toBe("growth/metrics/2026-w46.json");

    const decided = decideExperiment(
      dir,
      created.experiment.id,
      "iterate",
      "The calculator added friction; owners want us to estimate for them.",
    );
    expect(decided.experiment.status).toBe("complete");
    expect(decided.experiment.decision).toBe("iterate");

    const listed = listExperiments(loadRepo(dir));
    expect(listed.find((item) => item.id === created.experiment.id)?.decision).toBe("iterate");
  });

  it("refuses to decide without a receipted result", () => {
    const dir = repo();
    const created = createExperiment(dir, {
      hypothesis: "A comparison page will increase signups within one month.",
      channel: "seo",
      primaryMetric: { name: "signups", target: 50 },
    });
    expect(() => decideExperiment(dir, created.experiment.id, "kill", "It never ran.")).toThrow(
      /receipt/,
    );
  });

  it("refuses a result without a source", () => {
    const dir = repo();
    const created = createExperiment(dir, {
      hypothesis: "A comparison page will increase signups within one month.",
      channel: "seo",
      primaryMetric: { name: "signups", target: 50 },
    });
    expect(() =>
      logExperimentResult(dir, created.experiment.id, { metric: "signups", value: 3, source: " " }),
    ).toThrow(/receipt/);
  });
});
