import { z } from "zod";
import { GROWTHOS_SCHEMAS, MemoStatusSchema, TimestampSchema } from "./common.js";

export const MemoSchema = z.object({
  schema: z.literal(GROWTHOS_SCHEMAS.memo).default(GROWTHOS_SCHEMAS.memo),
  id: z.string().regex(/^memo_[0-9A-HJKMNP-TV-Z]{26}$/),
  period: z.string().min(1),
  status: MemoStatusSchema.default("draft"),
  generated_by: z.string().optional(),
  run_id: z.string().optional(),
  claim_count: z.number().int().nonnegative().optional(),
  receipt_count: z.number().int().nonnegative().optional(),
  source_diversity: z.number().int().nonnegative().optional(),
  created_at: TimestampSchema,
  published_at: TimestampSchema.nullable().optional(),
  supersedes: z.string().nullable().optional(),
});

export type Memo = z.infer<typeof MemoSchema>;

export const MEMO_KEYS = [
  "schema",
  "id",
  "period",
  "status",
  "generated_by",
  "run_id",
  "claim_count",
  "receipt_count",
  "source_diversity",
  "created_at",
  "published_at",
  "supersedes",
] as const;
