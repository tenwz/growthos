import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  computeQuoteHash,
  normalizeQuote,
  verifyQuoteHash,
} from "../src/evidence/hash.js";

describe("normalizeQuote", () => {
  it("collapses whitespace but preserves words", () => {
    expect(normalizeQuote("  We  lose\n calls\tper day.  ")).toBe("We lose calls per day.");
  });
});

describe("canonicalUrl", () => {
  it("strips tracking parameters and fragments", () => {
    expect(
      canonicalUrl(
        "https://x.com/acme/status/123?utm_source=newsletter&utm_medium=email&ref=hn#top",
      ),
    ).toBe("https://x.com/acme/status/123");
  });

  it("keeps meaningful query parameters", () => {
    expect(canonicalUrl("https://example.com/report?region=us&id=42")).toBe(
      "https://example.com/report?region=us&id=42",
    );
  });

  it("returns undefined for empty input", () => {
    expect(canonicalUrl(undefined)).toBeUndefined();
    expect(canonicalUrl("")).toBeUndefined();
  });
});

describe("computeQuoteHash", () => {
  it("is stable across whitespace and tracking parameters", () => {
    const a = computeQuoteHash({
      quote: "We lose  calls every day.",
      url: "https://x.com/acme/status/1?utm_source=a",
      publishedAt: "2026-11-01T10:00:00Z",
    });
    const b = computeQuoteHash({
      quote: "We lose calls every day.",
      url: "https://x.com/acme/status/1",
      publishedAt: "2026-11-01T10:00:00Z",
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("changes when the quote changes", () => {
    const base = { quote: "We lose calls.", url: "https://example.com/a" };
    const changed = { quote: "We lose calls every day.", url: "https://example.com/a" };
    expect(computeQuoteHash(base)).not.toBe(computeQuoteHash(changed));
  });

  it("verifies a matching hash and rejects a tampered one", () => {
    const hash = computeQuoteHash({ quote: "Missed calls cost us $4,800 a month." });
    expect(verifyQuoteHash({ quote: "Missed calls cost us $4,800 a month." }, hash).valid).toBe(
      true,
    );
    expect(verifyQuoteHash({ quote: "Missed calls cost us $9,000 a month." }, hash).valid).toBe(
      false,
    );
  });
});
