export interface ProviderInput {
  system: string;
  prompt: string;
  model?: string;
  timeoutMs?: number;
}

export interface Provider {
  id: string;
  complete(input: ProviderInput): Promise<string>;
}
