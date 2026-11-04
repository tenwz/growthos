import path from "node:path";
import {
  SignalSchema,
  SourceKindSchema,
  computeQuoteHash,
  isoDate,
  newId,
  nowIso,
  relativePath,
  repoPaths,
  requireRepo,
  slugify,
  stringifyFrontmatter,
  uniqueFilePath,
  writeText,
} from "@growthos/core";
import type { Command } from "commander";
import { CliError, EXIT } from "../ui/exit-codes.js";
import { hint, line, printJson, success } from "../ui/output.js";

interface CaptureOptions {
  source: string;
  url?: string;
  quote: string;
  summary?: string;
  segment?: string;
  tags?: string;
  provenance: "public" | "internal" | "synthetic";
  consent: "public" | "internal" | "anonymized";
  publishedAt?: string;
  dryRun?: boolean;
  json?: boolean;
  root?: string;
}

export function registerCapture(program: Command): void {
  program
    .command("capture")
    .description("Create an immutable signal from a verbatim quote and a source")
    .requiredOption("--quote <quote>", "verbatim quote from the source")
    .requiredOption(
      "--source <kind>",
      "x_post, reddit_comment, hn_comment, github_issue, interview, support_ticket, review, survey, call, metric, note, other",
    )
    .option("--url <url>", "source URL")
    .option("--summary <summary>", "neutral one-line summary")
    .option("--segment <segment>", "customer segment")
    .option("--tags <tags>", "comma-separated tags")
    .option("--provenance <provenance>", "public, internal, or synthetic", "public")
    .option("--consent <consent>", "public, internal, or anonymized", "public")
    .option("--published-at <timestamp>", "source publication timestamp")
    .option("--dry-run", "print the signal without writing it", false)
    .option("--json", "print machine-readable output", false)
    .option("--root <path>", "repo root")
    .action((options: CaptureOptions) => {
      const sourceKind = SourceKindSchema.safeParse(options.source);
      if (!sourceKind.success) {
        throw new CliError(
          `Unknown source kind "${options.source}". Use one of: x_post, reddit_comment, hn_comment, github_issue, interview, support_ticket, review, survey, call, metric, note, other.`,
          EXIT.USAGE,
        );
      }
      if (!options.quote.trim() || options.quote.trim().length < 3) {
        throw new CliError("--quote must contain the actual words from the source.", EXIT.USAGE);
      }
      if (options.provenance === "public" && !options.url) {
        throw new CliError(
          "Public signals need --url. Use --provenance internal for private notes.",
          EXIT.USAGE,
        );
      }

      const root = requireRepo(options.root);
      const capturedAt = nowIso();
      const hash = computeQuoteHash({
        quote: options.quote,
        url: options.url,
        publishedAt: options.publishedAt,
      });
      const signal = SignalSchema.parse({
        schema: "growthos/signal@1",
        id: newId("sig"),
        status: "active",
        provenance: options.provenance,
        captured_at: capturedAt,
        source: {
          kind: sourceKind.data,
          url: options.url,
          published_at: options.publishedAt,
          retrieved_at: capturedAt,
        },
        quote: options.quote.trim(),
        summary: options.summary,
        segment: options.segment,
        tags: options.tags
          ? options.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        consent: options.consent,
        integrity: {
          quote_hash: hash,
          canonical_url: options.url,
        },
        supersedes: null,
      });

      const dir = repoPaths(root).signals;
      const filename = `${isoDate(new Date(capturedAt))}-${sourceKind.data}-${slugify(options.quote, 42)}.md`;
      const file = uniqueFilePath(dir, filename.replace(/\.md$/, ""));
      const relPath = relativePath(root, file);

      if (options.dryRun) {
        if (options.json) {
          printJson({ signal, path: relPath });
        } else {
          line(JSON.stringify(signal, null, 2));
          line(hint(`Dry run. Would write ${relPath}`));
        }
        return;
      }

      writeText(
        file,
        stringifyFrontmatter(
          signal as unknown as Record<string, unknown>,
          "Captured by `growthos capture`.\n",
        ),
      );
      if (options.json) {
        printJson({ id: signal.id, path: relPath, hash });
      } else {
        success(`Captured ${signal.id} → ${relPath}`);
        line(hint(`Receipt hash ${hash.slice(0, 20)}…`));
      }
    });
}
