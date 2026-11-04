import { z } from "zod";
import { GROWTHOS_SCHEMAS, ThemeSchema } from "./common.js";

export const ProviderConfigSchema = z.object({
  default: z.string().default("command"),
  command: z
    .object({
      cmd: z.array(z.string()).min(1).default(["claude", "-p"]),
      timeout_seconds: z.number().int().positive().default(900),
    })
    .optional(),
  openai_compatible: z
    .object({
      base_url: z.string().url().default("https://api.openai.com/v1"),
      model: z.string().default("gpt-4.1-mini"),
      api_key_env: z.string().default("OPENAI_API_KEY"),
    })
    .optional(),
});

export const ScoreConfigSchema = z.object({
  min_signals: z.number().int().nonnegative().default(20),
  require_public_for_certified: z.boolean().default(true),
});

export const CockpitConfigSchema = z.object({
  title: z.string().default("Growth OS"),
  theme: ThemeSchema.default("dark"),
});

export const ConfigSchema = z.object({
  schema: z.literal(GROWTHOS_SCHEMAS.config).default(GROWTHOS_SCHEMAS.config),
  spec: z.string().default("0.1"),
  repo: z.object({
    name: z.string().min(1).default("Growth OS"),
    timezone: z.string().default("UTC"),
  }),
  providers: ProviderConfigSchema.default(() => ProviderConfigSchema.parse({})),
  score: ScoreConfigSchema.default(() => ScoreConfigSchema.parse({})),
  cockpit: CockpitConfigSchema.default(() => CockpitConfigSchema.parse({})),
});

export type GrowthConfig = z.infer<typeof ConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export const CONFIG_KEYS = ["schema", "spec", "repo", "providers", "score", "cockpit"] as const;
