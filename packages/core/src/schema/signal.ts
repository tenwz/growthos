import { z } from "zod";
import {
  ConsentSchema,
  GROWTHOS_SCHEMAS,
  ProvenanceSchema,
  SentimentSchema,
  SignalStatusSchema,
  SourceKindSchema,
  TimestampSchema,
} from "./common.js";

export const EventCountEvidenceSchema = z.object({
  kind: z.literal("event_count"),
  count: z.number().nonnegative(),
  of: z.number().nonnegative().optional(),
  query: z.string().optional(),
  window: z.string().optional(),
  source_url: z.string().url().optional(),
});

export const MetricEvidenceSchema = z.object({
  kind: z.literal("metric"),
  name: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  window: z.string().optional(),
  source_url: z.string().url().optional(),
});

export const EvidenceSchema = z.discriminatedUnion("kind", [
  EventCountEvidenceSchema,
  MetricEvidenceSchema,
]);

export type Evidence = z.infer<typeof EvidenceSchema>;

export const SignalSourceSchema = z.object({
  kind: SourceKindSchema,
  url: z.string().url().optional(),
  author: z.string().optional(),
  published_at: TimestampSchema.optional(),
  retrieved_at: TimestampSchema.optional(),
});

export const SignalIntegritySchema = z.object({
  quote_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  canonical_url: z.string().optional(),
});

export const SignalSchema = z.object({
  schema: z.literal(GROWTHOS_SCHEMAS.signal).default(GROWTHOS_SCHEMAS.signal),
  id: z.string().regex(/^sig_[0-9A-HJKMNP-TV-Z]{26}$/),
  status: SignalStatusSchema.default("active"),
  provenance: ProvenanceSchema.default("public"),
  captured_at: TimestampSchema,
  source: SignalSourceSchema,
  quote: z.string().min(3),
  summary: z.string().optional(),
  segment: z.string().optional(),
  sentiment: SentimentSchema.optional(),
  tags: z.array(z.string()).default([]),
  consent: ConsentSchema.default("public"),
  evidence: EvidenceSchema.optional(),
  integrity: SignalIntegritySchema.optional(),
  supersedes: z.string().nullable().optional(),
});

export type Signal = z.infer<typeof SignalSchema>;

export const SIGNAL_KEYS = [
  "schema",
  "id",
  "status",
  "provenance",
  "captured_at",
  "source",
  "quote",
  "summary",
  "segment",
  "sentiment",
  "tags",
  "consent",
  "evidence",
  "integrity",
  "supersedes",
] as const;
