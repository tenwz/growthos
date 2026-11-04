import { spawn } from "node:child_process";
import type { Provider, ProviderInput } from "./types.js";

/**
 * Runs any local command with the prompt on stdin and returns stdout.
 * Works with `claude -p`, `codex exec`, `ollama run <model>`, `llm`, or a custom script.
 */
export class CommandProvider implements Provider {
  readonly id = "command";

  constructor(
    private readonly cmd: string[],
    private readonly defaultTimeoutMs = 900_000,
  ) {
    if (cmd.length === 0) throw new Error("Command provider requires at least one command.");
  }

  async complete(input: ProviderInput): Promise<string> {
    const timeoutMs = input.timeoutMs ?? this.defaultTimeoutMs;
    const executable = this.cmd[0] as string;
    const args = this.cmd.slice(1);

    return new Promise<string>((resolve, reject) => {
      const child = spawn(executable, args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env,
      });
      let stdout = "";
      let stderr = "";
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill("SIGKILL");
        reject(new Error(`Provider command timed out after ${timeoutMs}ms: ${executable}`));
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(
          new Error(
            `Could not start provider command "${executable}": ${error.message}. Configure providers.command.cmd in .growthos/config.yaml.`,
          ),
        );
      });
      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code !== 0) {
          reject(
            new Error(
              `Provider command exited with code ${code}. ${stderr.trim().slice(0, 800) || "No stderr."}`,
            ),
          );
        } else {
          resolve(stdout);
        }
      });

      child.stdin.write(`SYSTEM:\n${input.system}\n\n---\n\n${input.prompt}`);
      child.stdin.end();
    });
  }
}
