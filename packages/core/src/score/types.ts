import type { RepoStats } from "../evidence/check.js";

export type ScoreTier = "Growth OS" | "System" | "Operator" | "Seedling" | "Draft";

export interface ScoreCheck {
  id: string;
  dimension: string;
  points: number;
  earned: number;
  detail: string;
}

export interface ScoreResult {
  score: number;
  tier: ScoreTier;
  color: string;
  certified: boolean;
  label: string;
  rubric: string;
  generatedAt: string;
  checks: ScoreCheck[];
  stats: RepoStats;
  synthetic: boolean;
  capApplied: number | null;
}

export interface Badge {
  schemaVersion: 1;
  label: string;
  message: string;
  color: string;
  cacheSeconds?: number;
}
