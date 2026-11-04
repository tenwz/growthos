import path from "node:path";
import { requireRepo } from "@growthos/core";
import type { Command } from "commander";
import { hint } from "../ui/output.js";

interface McpOptions {
  root?: string;
}

export function registerMcp(program: Command): void {
  program
    .command("mcp")
    .description("Start the local stdio MCP server")
    .option("--root <path>", "repo root")
    .action(async (options: McpOptions) => {
      const root = options.root ? path.resolve(options.root) : requireRepo();
      // Loaded lazily so the CLI stays fast and errors are actionable.
      const { startMcpServer } = await import("@growthos/mcp");
      process.stderr.write(`${hint(`growthOS MCP server · ${root}`)}\n`);
      await startMcpServer(root);
    });
}
