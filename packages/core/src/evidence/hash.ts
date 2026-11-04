import { createHash } from "node:crypto";

const TRACKING_PARAMS = new Set(["ref", "fbclid", "gclid", "igshid", "mc_cid", "mc_eid"]);

export function normalizeQuote(quote: string): string {
  return quote.replace(/\s+/g, " ").trim();
}

export function canonicalUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || TRACKING_PARAMS.has(key)) url.searchParams.delete(key);
    }
    if (url.pathname !== "/") {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return raw.trim();
  }
}

export interface QuoteHashInput {
  quote: string;
  url?: string;
  publishedAt?: string;
}

export function computeQuoteHash(input: QuoteHashInput): string {
  const payload = [
    normalizeQuote(input.quote),
    canonicalUrl(input.url) ?? "",
    input.publishedAt ?? "",
  ].join("\n");
  return `sha256:${createHash("sha256").update(payload, "utf8").digest("hex")}`;
}

export function verifyQuoteHash(
  input: QuoteHashInput,
  stored: string | undefined,
): { valid: boolean; expected: string } {
  const expected = computeQuoteHash(input);
  return { valid: stored === expected, expected };
}
