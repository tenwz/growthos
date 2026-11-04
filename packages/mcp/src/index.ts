import path from "node:path";
import {
  DecisionSchema,
  SignalSchema,
  SourceKindSchema,
  auditMemo,
  auditRepo,
  badgeFor,
  compileTask,
  computeQuoteHash,
  createExperiment,
  decideExperiment,
  generateCockpit,
  isoDate,
  listExperiments,
  loadRepo,
  logExperimentResult,
  newId,
  nowIso,
  relativePath,
  repoPaths,
  scoreRepo,
  slugify,
  stringifyFrontmatter,
  uniqueFilePath,
  writeText,
} from "@growthos/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const VERSION = "0.1.0";

function text(value: unknown): { content: { type: "text"; text: string }[] } {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function fail(error: unknown): { content: { type: "text"; text: string }[]; isError: true } {
  return {
    isError: true,
    content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
  };
}

function resolveMemo(repo: ReturnType<typeof loadRepo>, file?: string) {
  if (!file) return repo.memos.find((memo) => memo.data.status === "published") ?? repo.memos[0];
  const target = path.resolve(repo.root, file);
  return repo.memos.find((memo) => path.resolve(repo.root, memo.relPath) === target);
}

export function createMcpServer(root: string): McpServer {
  const server = new McpServer({ name: "growthos", version: VERSION });

  server.registerTool(
    "growthos_status",
    {
      title: "Growth OS status",
      description: "Repo counts, evidence errors, and the current Growth OS Score.",
      inputSchema: {},
    },
    () => {
      const repo = loadRepo(root);
      const audit = auditRepo(repo);
      const score = scoreRepo(audit);
      return text({
        root,
        ok: audit.ok,
        score: score.score,
        tier: score.tier,
        certified: score.certified,
        stats: audit.stats,
        errors: audit.errors.map((error) => error.message),
        warnings: audit.warnings.map((warning) => warning.message),
      });
    },
  );

  server.registerTool(
    "growthos_search_signals",
    {
      title: "Search signals",
      description: "Full-text search across verbatim customer signals, with optional filters.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe("Substring to match in quote, summary, tags, segment"),
        segment: z.string().optional(),
        tag: z.string().optional(),
        kind: SourceKindSchema.optional(),
        limit: z.number().int().min(1).max(100).default(20),
      },
    },
    ({ query, segment, tag, kind, limit }) => {
      const repo = loadRepo(root);
      const needle = query?.toLowerCase();
      const matches = repo.signals
        .filter((signal) => signal.data.status === "active")
        .filter((signal) => !segment || signal.data.segment === segment)
        .filter((signal) => !kind || signal.data.source.kind === kind)
        .filter((signal) => !tag || signal.data.tags.includes(tag))
        .filter((signal) => {
          if (!needle) return true;
          const haystack = [
            signal.data.quote,
            signal.data.summary ?? "",
            signal.data.segment ?? "",
            ...signal.data.tags,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(needle);
        })
        .slice(0, limit)
        .map((signal) => ({
          id: signal.data.id,
          quote: signal.data.quote,
          summary: signal.data.summary ?? null,
          segment: signal.data.segment ?? null,
          tags: signal.data.tags,
          kind: signal.data.source.kind,
          url: signal.data.source.url ?? null,
          provenance: signal.data.provenance,
          captured_at: signal.data.captured_at,
          file: signal.relPath,
        }));
      return text({ count: matches.length, signals: matches });
    },
  );

  server.registerTool(
    "growthos_get_signal",
    {
      title: "Get signal",
      description: "Fetch one signal by ID, including its source and receipt hash.",
      inputSchema: { id: z.string().describe("Signal ID, e.g. sig_01...") },
    },
    ({ id }) => {
      const repo = loadRepo(root);
      const signal = repo.signalById.get(id);
      if (!signal) return fail(new Error(`Signal ${id} not found.`));
      return text({ ...signal.data, file: signal.relPath });
    },
  );

  server.registerTool(
    "growthos_get_memo",
    {
      title: "Get memo",
      description: "Read a memo. Defaults to the latest published memo.",
      inputSchema: { file: z.string().optional().describe("Repo-relative memo path") },
    },
    ({ file }) => {
      const repo = loadRepo(root);
      const memo = resolveMemo(repo, file);
      if (!memo) return fail(new Error("No memo found."));
      return text({ path: memo.relPath, data: memo.data, body: memo.body });
    },
  );

  server.registerTool(
    "growthos_validate_memo",
    {
      title: "Validate memo",
      description: "Run every evidence rule against one memo. Returns exact failing claims.",
      inputSchema: {
        file: z
          .string()
          .optional()
          .describe("Repo-relative memo path; defaults to the latest published memo"),
        strict: z.boolean().default(false),
      },
    },
    ({ file, strict }) => {
      const repo = loadRepo(root);
      const memo = resolveMemo(repo, file);
      if (!memo) return fail(new Error("No memo found."));
      const audit = auditMemo(repo, memo, { strict });
      return text({
        path: memo.relPath,
        ok: audit.ok,
        claims: audit.claimCount,
        with_receipts: audit.claimsWithReceipts,
        receipts: audit.receiptsUsed,
        source_diversity: audit.sourceDiversity,
        errors: audit.errors.map((error) => ({
          rule: error.rule,
          message: error.message,
          claim: error.claim ?? null,
          line: error.line ?? null,
        })),
        warnings: audit.warnings.map((warning) => warning.message),
      });
    },
  );

  server.registerTool(
    "growthos_score",
    {
      title: "Growth OS Score",
      description: "Deterministic 100-point score with every check and its points.",
      inputSchema: { explain: z.boolean().default(true) },
    },
    ({ explain }) => {
      const score = scoreRepo(auditRepo(loadRepo(root)));
      return text(
        explain
          ? score
          : {
              score: score.score,
              tier: score.tier,
              certified: score.certified,
              synthetic: score.synthetic,
            },
      );
    },
  );

  server.registerTool(
    "growthos_list_experiments",
    {
      title: "List experiments",
      description: "Experiment ledger with status, target, observed value, and decision.",
      inputSchema: {},
    },
    () => text(listExperiments(loadRepo(root))),
  );

  server.registerTool(
    "growthos_capture_signal",
    {
      title: "Capture signal",
      description:
        "Capture a verbatim customer signal. Dry-run by default. Never invent quotes; every public signal needs a URL.",
      inputSchema: {
        quote: z.string().min(3).describe("Verbatim words from the source"),
        source: SourceKindSchema,
        url: z.string().url().optional(),
        summary: z.string().optional(),
        segment: z.string().optional(),
        tags: z.array(z.string()).default([]),
        provenance: z.enum(["public", "internal", "synthetic"]).default("public"),
        consent: z.enum(["public", "internal", "anonymized"]).default("public"),
        published_at: z.string().optional(),
        dry_run: z.boolean().default(true),
      },
    },
    (input) => {
      if (input.provenance === "public" && !input.url) {
        return fail(
          new Error("Public signals need a URL. Use provenance internal for private notes."),
        );
      }
      const capturedAt = nowIso();
      const signal = SignalSchema.parse({
        schema: "growthos/signal@1",
        id: newId("sig"),
        status: "active",
        provenance: input.provenance,
        captured_at: capturedAt,
        source: {
          kind: input.source,
          url: input.url,
          published_at: input.published_at,
          retrieved_at: capturedAt,
        },
        quote: input.quote,
        summary: input.summary,
        segment: input.segment,
        tags: input.tags,
        consent: input.consent,
        integrity: {
          quote_hash: computeQuoteHash({
            quote: input.quote,
            url: input.url,
            publishedAt: input.published_at,
          }),
          canonical_url: input.url,
        },
        supersedes: null,
      });
      const dir = repoPaths(root).signals;
      const file = uniqueFilePath(
        dir,
        `${isoDate(new Date(capturedAt))}-${input.source}-${slugify(input.quote, 42)}`,
      );
      if (input.dry_run) {
        return text({ dry_run: true, would_write: relativePath(root, file), signal });
      }
      writeText(
        file,
        stringifyFrontmatter(signal as unknown as Record<string, unknown>, "Captured via MCP.\n"),
      );
      return text({ dry_run: false, id: signal.id, path: relativePath(root, file) });
    },
  );

  server.registerTool(
    "growthos_create_experiment",
    {
      title: "Create experiment",
      description:
        "Create an experiment tied to signals. Proposals only; a human runs and decides it.",
      inputSchema: {
        hypothesis: z.string().min(10),
        channel: z.string(),
        metric: z.string(),
        signal_ids: z.array(z.string()).default([]),
        audience: z.string().optional(),
        baseline: z.number().nullable().optional(),
        target: z.number().nullable().optional(),
      },
    },
    (input) => {
      const created = createExperiment(root, {
        hypothesis: input.hypothesis,
        channel: input.channel,
        signalIds: input.signal_ids,
        audience: input.audience,
        primaryMetric: {
          name: input.metric,
          baseline: input.baseline ?? null,
          target: input.target ?? null,
          observed: null,
        },
      });
      return text({ id: created.experiment.id, file: relativePath(root, created.file) });
    },
  );

  server.registerTool(
    "growthos_log_experiment_result",
    {
      title: "Log experiment result",
      description: "Append a metric result. A receipt (URL or file path) is mandatory.",
      inputSchema: {
        id: z.string(),
        metric: z.string(),
        value: z.number(),
        source: z.string(),
        date: z.string().optional(),
      },
    },
    (input) => {
      const result = logExperimentResult(root, input.id, {
        metric: input.metric,
        value: input.value,
        source: input.source,
        date: input.date,
      });
      return text({
        id: input.id,
        status: result.experiment.status,
        observed: result.experiment.primary_metric.observed,
      });
    },
  );

  server.registerTool(
    "growthos_decide_experiment",
    {
      title: "Decide experiment",
      description: "Close an experiment. Requires a result with a receipt and a written learning.",
      inputSchema: {
        id: z.string(),
        decision: DecisionSchema,
        learning: z.string().min(1),
      },
    },
    (input) => {
      const result = decideExperiment(root, input.id, input.decision, input.learning);
      return text({
        id: input.id,
        decision: result.experiment.decision,
        learning_file: relativePath(root, result.learningFile),
      });
    },
  );

  server.registerTool(
    "growthos_compile_job",
    {
      title: "Compile agent job",
      description:
        "Build prompt.md, context.json, and output.schema.json for a job. Signals are wrapped as untrusted data.",
      inputSchema: {
        job: z.string(),
        since: z.string().optional(),
        segment: z.string().optional(),
        tag: z.string().optional(),
        max_signals: z.number().int().min(1).max(200).default(40),
      },
    },
    (input) => {
      const repo = loadRepo(root);
      const compiled = compileTask(repo, input.job, {
        since: input.since,
        segment: input.segment,
        tag: input.tag,
        maxSignals: input.max_signals,
      });
      return text({
        run_id: compiled.runId,
        run_dir: relativePath(root, compiled.runDir),
        prompt: relativePath(root, path.join(compiled.runDir, "prompt.md")),
        manifest: compiled.manifest,
        output_paths: compiled.outputPaths,
      });
    },
  );

  server.registerTool(
    "growthos_build_cockpit",
    {
      title: "Build cockpit",
      description: "Regenerate the static cockpit, badge, and share card.",
      inputSchema: {
        theme: z.enum(["dark", "light"]).optional(),
      },
    },
    ({ theme }) => {
      const repo = loadRepo(root);
      const audit = auditRepo(repo);
      const score = scoreRepo(audit);
      const first = generateCockpit(repo, audit, score, { theme });
      const refreshed = loadRepo(root);
      const refreshedAudit = auditRepo(refreshed);
      const result = generateCockpit(refreshed, refreshedAudit, scoreRepo(refreshedAudit), {
        theme,
      });
      return text({
        path: result.htmlPath,
        first_pass: relativePath(root, first.htmlPath),
        score: scoreRepo(refreshedAudit).score,
        badge: badgeFor(scoreRepo(refreshedAudit)),
      });
    },
  );

  server.registerResource(
    "spec",
    "growthos://spec",
    { title: "Growth Repo Spec", mimeType: "text/markdown" },
    async () => {
      const repo = loadRepo(root);
      return {
        contents: [
          {
            uri: "growthos://spec",
            mimeType: "text/markdown",
            text: [
              "# Growth Repo Spec v0.1",
              "",
              "A Growth OS is a folder your coding agent can read.",
              "",
              "- `growth/signals/` — append-only verbatim customer signals with source, consent, and a quote hash.",
              "- `growth/memos/` — claims that cite signals as `[@sig_...]`; every claim needs a receipt.",
              "- `growth/experiments/` — hypothesis → metric receipt → decision → learning.",
              "- `growth/agents/` — job specs with data sources, quality bar, approval, and write-back.",
              "- `.growthos/config.yaml` — provider, thresholds, cockpit.",
              "",
              `This repo has ${repo.signals.length} signals, ${repo.memos.length} memos, ${repo.experiments.length} experiments, ${repo.jobs.length} jobs.`,
            ].join("\n"),
          },
        ],
      };
    },
  );

  server.registerResource(
    "signals",
    "growthos://signals",
    { title: "Signals", mimeType: "application/json" },
    async () => {
      const repo = loadRepo(root);
      return {
        contents: [
          {
            uri: "growthos://signals",
            mimeType: "application/json",
            text: JSON.stringify(
              repo.signals.map((signal) => ({
                id: signal.data.id,
                quote: signal.data.quote,
                segment: signal.data.segment,
                tags: signal.data.tags,
                provenance: signal.data.provenance,
                file: signal.relPath,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "weekly-customer-truth",
    {
      title: "Weekly customer truth",
      description: "Draft the weekly memo from receipts, refusing claims without evidence.",
      argsSchema: { since: z.string().optional().describe("Window such as 7d") },
    },
    ({ since }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Compile this week's customer truth memo.",
              "",
              `Window: ${since ?? "7d"}.`,
              "1. Search growth/signals for active signals in the window.",
              "2. Write 5–7 specific claims. Every claim must cite [@sig_...] receipts.",
              "3. Quote verbatim. Never invent or paraphrase a quote as if it were verbatim.",
              "4. Add a 'What we are not saying' section and a 'Next tests' section.",
              "5. Run growthos_validate_memo and fix every error before proposing the memo.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  return server;
}

export async function startMcpServer(root: string): Promise<void> {
  const server = createMcpServer(root);
  await server.connect(new StdioServerTransport());
}
