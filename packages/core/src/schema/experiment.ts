import { z } from "zod";
import {
  DecisionSchema,
  ExperimentStatusSchema,
  GROWTHOS_SCHEMAS,
  TimestampSchema,
} from "./common.js";

export const PrimaryMetricSchema = z.object({
  name: z.string().min(1),
  baseline: z.number().nullable().optional(),
  target: z.number().nullable().optional(),
  observed: z.number().nullable().optional(),
});

export const ExperimentSchema = z.object({
  schema: z.literal(GROWTHOS_SCHEMAS.experiment).default(GROWTHOS_SCHEMAS.experiment),
  id: z.string().regex(/^exp_[0-9A-HJKMNP-TV-Z]{26}$/),
  status: ExperimentStatusSchema.default("proposed"),
  hypothesis: z.string().min(10),
  signal_ids: z.array(z.string().regex(/^sig_[0-9A-HJKMNP-TV-Z]{26}$/)).default([]),
  channel: z.string().min(1),
  audience: z.string().optional(),
  owner: z.string().default("human"),
  start_at: TimestampSchema.optional(),
  end_at: TimestampSchema.optional(),
  primary_metric: PrimaryMetricSchema,
  guardrails: z.array(z.string()).default([]),
  decision: DecisionSchema.nullable().default(null),
  learning: z.string().nullable().default(null),
});

export type Experiment = z.infer<typeof ExperimentSchema>;

export const EXPERIMENT_KEYS = [
  "schema",
  "id",
  "status",
  "hypothesis",
  "signal_ids",
  "channel",
  "audience",
  "owner",
  "start_at",
  "end_at",
  "primary_metric",
  "guardrails",
  "decision",
  "learning",
] as const;
