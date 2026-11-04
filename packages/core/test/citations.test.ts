import { describe, expect, it } from "vitest";
import {
  claimSimilarity,
  extractCitations,
  extractClaims,
  extractReceiptTableIds,
  markdownToPlain,
} from "../src/markdown/citations.js";

const SIG = "sig_01J8ZQ9V6K4M2N8P3R5T7W9X1Y";

describe("extractCitations", () => {
  it("finds bracketed signal IDs", () => {
    expect(extractCitations(`Owners lose calls [@${SIG}].`)).toEqual([SIG]);
  });

  it("dedupes IDs within one claim", () => {
    expect(extractCitations(`[@${SIG}] and [@${SIG}]`)).toEqual([SIG]);
  });

  it("ignores malformed IDs", () => {
    expect(extractCitations("[@sig_notavalidulid] [@sig_01J8ZQ9V6K4M2N8P3R5T7W9X1Y]")).toEqual([
      "sig_01J8ZQ9V6K4M2N8P3R5T7W9X1Y",
    ]);
  });
});

describe("extractClaims", () => {
  const body = `# Memo

## Claims

1. Owners lose calls [@${SIG}].
2. **Dispatch is chaotic** [@${SIG}].
   - This nested note is not a claim.
3. Vague statement.

## Next tests

1. Not a claim either.
`;

  it("extracts only top-level list items under Claims", () => {
    const claims = extractClaims(body);
    expect(claims).toHaveLength(3);
    expect(claims[0]?.text).toContain("Owners lose calls");
    expect(claims[1]?.text).toContain("Dispatch is chaotic");
    expect(claims[2]?.text).toBe("Vague statement.");
  });

  it("records one-based indexes", () => {
    expect(extractClaims(body).map((claim) => claim.index)).toEqual([1, 2, 3]);
  });
});

describe("markdownToPlain", () => {
  it("strips emphasis, code, links, and citation syntax", () => {
    expect(markdownToPlain(`**Bold** and \`code\` [link](https://x.com) [@${SIG}]`)).toBe(
      "Bold and code link",
    );
  });
});

describe("claimSimilarity", () => {
  it("is high for paraphrases and low for different claims", () => {
    const a = "HVAC owners lose revenue to missed calls every week";
    const b = "HVAC owners lose revenue from missed calls each week";
    const c = "Dispatchers want a mobile app with dark mode";
    expect(claimSimilarity(a, b)).toBeGreaterThan(0.5);
    expect(claimSimilarity(a, c)).toBeLessThan(0.2);
  });
});

describe("extractReceiptTableIds", () => {
  it("reads signal IDs from a receipts table", () => {
    const table = `## Receipts

| Claim | Signal | Source | Quote |
| --- | --- | --- | --- |
| 1 | [@${SIG}] | x | "..." |`;
    expect(extractReceiptTableIds(table)).toEqual([SIG]);
  });
});
