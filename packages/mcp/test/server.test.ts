import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, tempRepo } from "../../core/test/helpers.js";
import { createMcpServer } from "../src/index.js";

const dirs: string[] = [];
let client: Client | null = null;

async function connect(): Promise<{ client: Client; dir: string }> {
  const dir = tempRepo();
  dirs.push(dir);
  const server = createMcpServer(dir);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test-client", version: "0.0.0" }, { capabilities: {} });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, dir };
}

function payload(result: Awaited<ReturnType<Client["callTool"]>>): Record<string, unknown> {
  const content = (result as { content?: { type: string; text?: string }[] }).content ?? [];
  const first = content.find((item) => item.type === "text");
  return JSON.parse(first?.text ?? "{}") as Record<string, unknown>;
}

afterEach(() => {
  client = null;
  while (dirs.length) cleanup(dirs.pop() as string);
});

describe("growthOS MCP server", () => {
  it("exposes the core tools", async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    const names = (tools as Tool[]).map((tool) => tool.name);
    expect(names).toContain("growthos_status");
    expect(names).toContain("growthos_search_signals");
    expect(names).toContain("growthos_validate_memo");
    expect(names).toContain("growthos_score");
    expect(names).toContain("growthos_capture_signal");
    expect(names).toContain("growthos_compile_job");
    expect(names).toContain("growthos_decide_experiment");
  });

  it("returns repo status and score", async () => {
    const { client } = await connect();
    const status = payload(await client.callTool({ name: "growthos_status", arguments: {} }));
    expect(status.ok).toBe(false);
    expect((status.stats as Record<string, unknown>).activeSignals).toBe(31);
  });

  it("fails a memo with an exact claim", async () => {
    const { client } = await connect();
    const result = payload(
      await client.callTool({
        name: "growthos_validate_memo",
        arguments: { file: "growth/memos/2026-11-03-draft-missed-call-ai.md" },
      }),
    );
    expect(result.ok).toBe(false);
    const errors = result.errors as { claim?: string; message: string }[];
    expect(errors.some((error) => error.claim?.includes("AI SDR"))).toBe(true);
  });

  it("dry-runs capture by default and never invents a URL", async () => {
    const { client } = await connect();
    const missingUrl = await client.callTool({
      name: "growthos_capture_signal",
      arguments: { quote: "We miss calls all day.", source: "x_post", provenance: "public" },
    });
    expect(missingUrl.isError).toBe(true);

    const result = payload(
      await client.callTool({
        name: "growthos_capture_signal",
        arguments: {
          quote: "We miss calls all day.",
          source: "x_post",
          url: "https://example.com/post/9",
          provenance: "public",
          dry_run: true,
        },
      }),
    );
    expect(result.dry_run).toBe(true);
    expect(result.would_write).toContain("growth/signals/");
  });

  it("searches signals by verbatim text", async () => {
    const { client } = await connect();
    const result = payload(
      await client.callTool({
        name: "growthos_search_signals",
        arguments: { query: "missed", limit: 5 },
      }),
    );
    expect(Number(result.count)).toBeGreaterThan(0);
  });
});
