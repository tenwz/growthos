import path from "node:path";

export const CONFIG_REL = ".growthos/config.yaml";
export const GROWTH_REL = "growth";
export const SIGNALS_REL = "growth/signals";
export const MEMOS_REL = "growth/memos";
export const EXPERIMENTS_REL = "growth/experiments";
export const AGENTS_REL = "growth/agents";
export const LEARNINGS_REL = "growth/learnings";
export const METRICS_REL = "growth/metrics";
export const EVALS_REL = "growth/evals";
export const COCKPIT_REL = "growth/cockpit";
export const PROOF_REL = "PROOF.md";

export interface RepoPaths {
  root: string;
  config: string;
  growth: string;
  signals: string;
  memos: string;
  experiments: string;
  agents: string;
  learnings: string;
  metrics: string;
  evals: string;
  cockpit: string;
  proof: string;
}

export function repoPaths(root: string): RepoPaths {
  return {
    root,
    config: path.join(root, CONFIG_REL),
    growth: path.join(root, GROWTH_REL),
    signals: path.join(root, SIGNALS_REL),
    memos: path.join(root, MEMOS_REL),
    experiments: path.join(root, EXPERIMENTS_REL),
    agents: path.join(root, AGENTS_REL),
    learnings: path.join(root, LEARNINGS_REL),
    metrics: path.join(root, METRICS_REL),
    evals: path.join(root, EVALS_REL),
    cockpit: path.join(root, COCKPIT_REL),
    proof: path.join(root, PROOF_REL),
  };
}
