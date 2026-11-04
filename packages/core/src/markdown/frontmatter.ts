import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export interface ParsedMarkdown {
  data: Record<string, unknown>;
  body: string;
  hasFrontmatter: boolean;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(raw: string): ParsedMarkdown {
  const normalized = raw.replace(/^﻿/, "");
  const match = normalized.match(FRONTMATTER_RE);
  if (!match) {
    return { data: {}, body: normalized, hasFrontmatter: false };
  }
  const yamlText = match[1] ?? "";
  let data: unknown;
  try {
    data = parseYaml(yamlText);
  } catch (error) {
    throw new Error(`Invalid YAML frontmatter: ${(error as Error).message}`);
  }
  if (data !== null && data !== undefined && (typeof data !== "object" || Array.isArray(data))) {
    throw new Error("Frontmatter must be a YAML mapping");
  }
  return {
    data: (data as Record<string, unknown>) ?? {},
    body: normalized.slice(match[0].length),
    hasFrontmatter: true,
  };
}

export function stringifyFrontmatter(data: Record<string, unknown>, body: string): string {
  const yamlText = stringifyYaml(data, {
    lineWidth: 0,
    sortMapEntries: false,
    defaultStringType: "QUOTE_DOUBLE",
    defaultKeyType: "PLAIN",
  }).trimEnd();
  const cleanedBody = body.replace(/^\s*\n/, "").trimEnd();
  return `---\n${yamlText}\n---\n\n${cleanedBody}\n`;
}
