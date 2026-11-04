import path from "node:path";
import { fileURLToPath } from "node:url";
import { exists } from "@growthos/core";

const here = path.dirname(fileURLToPath(import.meta.url));

const CANDIDATES = [path.resolve(here, "../assets"), path.resolve(here, "../../../")];

export function assetsRoot(): string {
  for (const candidate of CANDIDATES) {
    if (exists(candidate)) return candidate;
  }
  throw new Error("Could not locate growthOS assets. Reinstall the package.");
}

export function assetPath(...parts: string[]): string {
  for (const candidate of CANDIDATES) {
    const target = path.resolve(candidate, ...parts);
    if (exists(target)) return target;
  }
  throw new Error(`Missing asset: ${parts.join("/")}`);
}
