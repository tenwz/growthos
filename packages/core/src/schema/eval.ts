import { z } from "zod";
import { GROWTHOS_SCHEMAS, TimestampSchema } from "./common.js";

export const EvalCheckSchema = z.object({
  id: z.string().min(1),
  points: z.number(),
  earned: z.number(),
  detail: z.string(),
});

export const EvalSchema = z.object({
  schema: z.literal(GROWTHOS_SCHEMAS.eval).default(GROWTHOS_SCHEMAS.eval),
  id: z.string().regex(/^eval_[0-9A-HJKMNP-TV-Z]{26}$/),
  target: z.string().min(1),
  rubric: z.string().min(1),
  deterministic_score: z.number().min(0).max(100),
  judge_penalty: z.number().min(0).max(15).default(0),
  final_score: z.number().min(0).max(100),
  checks: z.array(EvalCheckSchema).default([]),
  judge: z.record(z.unknown()).nullable().default(null),
  created_at: TimestampSchema,
});

export type EvalFile = z.infer<typeof EvalSchema>;
