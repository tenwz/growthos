import { spawn } from "node:child_process";
import path from "node:path";
import type { CheckResult } from "@growthos/core";
import pc from "picocolors";

export const symbols = {
  pass: pc.green("PASS"),
  fail: pc.red("FAIL"),
  warn: pc.yellow("WARN"),
  info: pc.cyan("•"),
  check: pc.green("✓"),
  cross: pc.red("✗"),
  arrow: pc.dim("→"),
};

export function title(text: string): string {
  return `${pc.bold(text)}`;
}

export function hint(text: string): string {
  return pc.dim(text);
}

export function section(text: string): void {
  console.log(`\n${pc.bold(text)}`);
}

export function line(text = ""): void {
  console.log(text);
}

export function success(text: string): void {
  console.log(`${symbols.check} ${text}`);
}

export function failure(text: string): void {
  console.error(`${symbols.cross} ${text}`);
}

export function formatCheck(check: CheckResult): string {
  const label = check.ok ? symbols.pass : check.severity === "error" ? symbols.fail : symbols.warn;
  const location = check.path ? pc.dim(check.path) : "";
  const lineNumber = check.line ? pc.dim(`:${check.line}`) : "";
  return `  ${label}  ${check.message}${location ? `  ${location}${lineNumber}` : ""}`;
}

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function openFile(target: string): boolean {
  const file = path.resolve(target);
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", file] : [file];
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

export function printBanner(version: string): void {
  console.log(`${pc.bold("growthOS")} ${pc.dim(`v${version}`)}`);
}

export function summary(errors: number, warnings: number): string {
  if (errors === 0 && warnings === 0) return pc.green("No issues found.");
  const parts: string[] = [];
  if (errors > 0) parts.push(pc.red(`${errors} error${errors === 1 ? "" : "s"}`));
  if (warnings > 0) parts.push(pc.yellow(`${warnings} warning${warnings === 1 ? "" : "s"}`));
  return parts.join(", ");
}
