import { z } from "zod";

export const TimestampSchema = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "must be an ISO timestamp");

export const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

export const ProvenanceSchema = z.enum(["public", "internal", "synthetic"]);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const ConsentSchema = z.enum(["public", "internal", "anonymized"]);
export type Consent = z.infer<typeof ConsentSchema>;

export const SignalStatusSchema = z.enum(["active", "retracted", "superseded"]);
export type SignalStatus = z.infer<typeof SignalStatusSchema>;

export const SourceKindSchema = z.enum([
  "x_post",
  "reddit_comment",
  "hn_comment",
  "github_issue",
  "interview",
  "support_ticket",
  "review",
  "survey",
  "call",
  "metric",
  "note",
  "other",
]);
export type SourceKind = z.infer<typeof SourceKindSchema>;

export const SentimentSchema = z.enum(["positive", "negative", "neutral", "mixed"]);

export const MemoStatusSchema = z.enum(["draft", "published", "rejected"]);

export const ExperimentStatusSchema = z.enum(["proposed", "running", "complete", "abandoned"]);

export const DecisionSchema = z.enum(["scale", "iterate", "kill", "inconclusive"]);

export const ThemeSchema = z.enum(["dark", "light"]);

export const GROWTHOS_SCHEMAS = {
  config: "growthos/config@1",
  signal: "growthos/signal@1",
  memo: "growthos/memo@1",
  experiment: "growthos/experiment@1",
  job: "growthos/job@1",
  eval: "growthos/eval@1",
} as const;

export function isXKey(key: string): boolean {
  return key.startsWith("x_");
}

export function unknownKeys(data: Record<string, unknown>, known: readonly string[]): string[] {
  return Object.keys(data).filter((key) => !known.includes(key) && !isXKey(key));
}
