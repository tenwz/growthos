import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const EXAMPLE_REPO = path.resolve(here, "../../../examples/hvac-saas");

export function tempRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "growthos-test-"));
  fs.cpSync(EXAMPLE_REPO, dir, { recursive: true });
  return dir;
}

export function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function listSignalFiles(dir: string): string[] {
  return fs
    .readdirSync(path.join(dir, "growth/signals"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, "growth/signals", name));
}

export function requireDefined<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Test fixture missing: ${label}`);
  }
  return value;
}
