import type { GrowthConfig } from "../schema/config.js";
import { CommandProvider } from "./command.js";
import { OpenAICompatibleProvider } from "./openai-compatible.js";
import type { Provider } from "./types.js";

export * from "./types.js";
export * from "./command.js";
export * from "./openai-compatible.js";

export interface ProviderOverride {
  id?: string;
  model?: string;
}

export function createProvider(
  config: GrowthConfig | null,
  override: ProviderOverride = {},
): Provider {
  const requested = override.id ?? config?.providers.default ?? "command";
  if (requested === "command") {
    const cmd = config?.providers.command?.cmd ?? ["claude", "-p"];
    const timeout = (config?.providers.command?.timeout_seconds ?? 900) * 1000;
    return new CommandProvider(cmd, timeout);
  }
  if (
    requested === "openai" ||
    requested === "openai-compatible" ||
    requested === "openai_compatible"
  ) {
    const options = config?.providers.openai_compatible;
    if (!options) {
      throw new Error("providers.openai_compatible is not configured in .growthos/config.yaml.");
    }
    return new OpenAICompatibleProvider({
      baseUrl: options.base_url,
      model: override.model ?? options.model,
      apiKeyEnv: options.api_key_env,
    });
  }
  throw new Error(`Unknown provider "${requested}". Use command or openai-compatible.`);
}
