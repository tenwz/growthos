const SIGNAL_ID = "sig_[0-9A-HJKMNP-TV-Z]{26}";
const CITATION_RE = new RegExp(`\\[@(${SIGNAL_ID})\\]`, "g");
const ANY_SIGNAL_ID_RE = new RegExp(`\\b(${SIGNAL_ID})\\b`, "g");

export interface Claim {
  index: number;
  text: string;
  line: number;
  citations: string[];
}

function stripCodeSpans(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, (match) => " ".repeat(match.length))
    .replace(/`[^`]*`/g, (match) => " ".repeat(match.length));
}

export function extractCitations(text: string): string[] {
  const clean = stripCodeSpans(text);
  const found = new Set<string>();
  for (const match of clean.matchAll(CITATION_RE)) {
    const id = match[1];
    if (id) found.add(id);
  }
  return [...found];
}

export function extractAllSignalIds(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(ANY_SIGNAL_ID_RE)) {
    const id = match[1];
    if (id) found.add(id);
  }
  return [...found];
}

export interface Section {
  heading: string;
  level: number;
  startLine: number;
  content: string;
}

export function extractSections(body: string): Section[] {
  const lines = body.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section | null = null;
  const push = () => {
    if (current) {
      current.content = current.content.trim();
      sections.push(current);
    }
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      push();
      const level = (match[1] ?? "").length;
      current = {
        heading: (match[2] ?? "").trim(),
        level,
        startLine: index + 1,
        content: "",
      };
    } else if (current) {
      current.content += `${line}\n`;
    }
  }
  push();
  return sections;
}

export function extractSection(body: string, heading: string): string | null {
  const target = heading.trim().toLowerCase();
  const section = extractSections(body).find(
    (candidate) => candidate.heading.trim().toLowerCase() === target,
  );
  return section ? section.content : null;
}

/**
 * Extract top-level list items under `## Claims`.
 * Continuation lines belong to the previous claim until the next list item or heading.
 */
export function extractClaims(body: string): Claim[] {
  const lines = body.split(/\r?\n/);
  let inClaims = false;
  let claimLevel = 2;
  const claims: Claim[] = [];
  let current: Claim | null = null;

  const flush = () => {
    if (current) {
      current.text = current.text.replace(/\s+/g, " ").trim();
      current.citations = extractCitations(current.text);
      claims.push(current);
      current = null;
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = (heading[1] ?? "").length;
      const title = (heading[2] ?? "").trim().toLowerCase();
      if (inClaims && level <= claimLevel) {
        flush();
        inClaims = false;
      }
      if (!inClaims && title === "claims") {
        inClaims = true;
        claimLevel = level;
      }
      continue;
    }
    if (!inClaims) continue;
    const listItem = line.match(/^(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (listItem) {
      flush();
      current = {
        index: claims.length + 1,
        text: listItem[1] ?? "",
        line: index + 1,
        citations: [],
      };
      continue;
    }
    if (current) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        current.text += ` ${trimmed}`;
      }
    }
  }
  flush();
  return claims;
}

/** Parse the signal IDs listed in the generated `## Receipts` table. */
export function extractReceiptTableIds(body: string): string[] {
  const receipts = extractSection(body, "Receipts");
  if (!receipts) return [];
  const ids = new Set<string>();
  for (const match of receipts.matchAll(new RegExp(`\\b(${SIGNAL_ID})\\b`, "g"))) {
    const id = match[1];
    if (id) ids.add(id);
  }
  return [...ids];
}

export function hasReceiptsTable(body: string): boolean {
  return extractSection(body, "Receipts") !== null;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "are",
  "was",
  "were",
  "have",
  "has",
  "not",
  "but",
  "they",
  "their",
  "you",
  "your",
  "our",
  "are",
  "is",
  "of",
  "to",
  "in",
  "on",
  "a",
  "an",
  "as",
  "at",
  "by",
  "it",
  "or",
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/\[@[^\]]+\]/g, " ")
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3 && !STOP_WORDS.has(token)),
  );
}

/** Jaccard similarity over meaningful tokens. */
export function claimSimilarity(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

export function markdownToPlain(value: string): string {
  return value
    .replace(/\[@[^\]]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
