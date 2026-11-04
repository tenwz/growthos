import path from "node:path";
import { exists, findUp, isDirectory } from "../util/fs.js";
import { CONFIG_REL } from "./paths.js";

/** Walk up from `start` until a growthOS config or growth/ folder is found. */
export function discoverRepo(start: string = process.cwd()): string | null {
  const resolved = path.resolve(start);
  const byConfig = findUp(resolved, [CONFIG_REL]);
  if (byConfig) return byConfig;
  const byGrowth = findUp(resolved, ["growth"]);
  if (byGrowth && isDirectory(path.join(byGrowth, "growth"))) return byGrowth;
  return null;
}

export function isGrowthRepo(root: string): boolean {
  return exists(path.join(root, CONFIG_REL)) || isDirectory(path.join(root, "growth"));
}

export function requireRepo(start?: string): string {
  const root = discoverRepo(start);
  if (!root) {
    throw new Error("No growthOS repo found. Run `growthos init` first, or pass a path to a repo.");
  }
  return root;
}
