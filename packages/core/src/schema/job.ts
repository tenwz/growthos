import { z } from "zod";
import { GROWTHOS_SCHEMAS } from "./common.js";

export const JobDataSourceSchema = z.object({
  kind: z.enum(["signal_glob", "metric_glob", "file_glob"]),
  path: z.string().min(1),
  filters: z.record(z.unknown()).optional(),
});

export const JobOutputSchema = z.object({
  path: z.string().min(1),
  schema: z.string().min(1),
});

export const QualityBarSchema = z.object({
  min_receipts_per_claim: z.number().int().positive().default(1),
  require_verbatim_quote: z.boolean().default(true),
  require_source_url: z.boolean().default(true),
  min_source_diversity: z.number().int().positive().default(2),
  max_claims: z.number().int().positive().default(7),
});

export const JobSchema = z.object({
  schema: z.literal(GROWTHOS_SCHEMAS.job).default(GROWTHOS_SCHEMAS.job),
  id: z.string().regex(/^job_[a-z0-9-]+$/),
  name: z.string().min(1),
  version: z.number().int().positive().default(1),
  enabled: z.boolean().default(true),
  data_sources: z.array(JobDataSourceSchema).min(1),
  schedule: z.string().min(1),
  filters: z.record(z.unknown()).default({}),
  outputs: z.array(JobOutputSchema).min(1),
  quality_bar: QualityBarSchema.default({}),
  human_approval: z.boolean(),
  success_metric: z.string().min(1),
  write_back: z
    .object({
      learnings: z.string().optional(),
      rejected: z.string().optional(),
    })
    .default({}),
});

export type Job = z.infer<typeof JobSchema>;

export const JOB_KEYS = [
  "schema",
  "id",
  "name",
  "version",
  "enabled",
  "data_sources",
  "schedule",
  "filters",
  "outputs",
  "quality_bar",
  "human_approval",
  "success_metric",
  "write_back",
] as const;

/** The eight fields a job spec must define, mirroring Greg Isenberg's agent JD. */
export const REQUIRED_JOB_FIELDS = [
  "data_sources",
  "schedule",
  "filters",
  "outputs",
  "quality_bar",
  "human_approval",
  "success_metric",
  "write_back",
] as const;
