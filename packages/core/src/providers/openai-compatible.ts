import type { Provider, ProviderInput } from "./types.js";

export interface OpenAICompatibleOptions {
  baseUrl: string;
  model: string;
  apiKeyEnv?: string;
  timeoutMs?: number;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
}

export class OpenAICompatibleProvider implements Provider {
  readonly id = "openai-compatible";

  constructor(private readonly options: OpenAICompatibleOptions) {}

  async complete(input: ProviderInput): Promise<string> {
    const envName = this.options.apiKeyEnv ?? "OPENAI_API_KEY";
    const apiKey = process.env[envName];
    if (!apiKey) {
      throw new Error(`Missing ${envName}. Set it or use the default command provider.`);
    }
    const baseUrl = this.options.baseUrl.replace(/\/+$/, "");
    const model = input.model ?? this.options.model;
    const timeoutMs = input.timeoutMs ?? this.options.timeoutMs ?? 900_000;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const body = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(
        `Provider request failed (${response.status}): ${body.error?.message ?? response.statusText}`,
      );
    }
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Provider returned an empty response.");
    }
    return content;
  }
}
