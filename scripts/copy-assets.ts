/**
 * Copies repo assets into the published CLI package.
 * Runs automatically from `prepack`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = path.join(root, "packages", "cli");
const assetsDir = path.join(cliDir, "assets");

fs.rmSync(assetsDir, { recursive: true, force: true });
fs.mkdirSync(assetsDir, { recursive: true });

for (const name of ["templates", "examples", "skills", "spec"]) {
  const src = path.join(root, name);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(assetsDir, name), { recursive: true });
  console.log(`copied: ${name}/`);
}

for (const name of ["README.md", "LICENSE"]) {
  const src = path.join(root, name);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(cliDir, name));
  console.log(`copied: ${name}`);
}
