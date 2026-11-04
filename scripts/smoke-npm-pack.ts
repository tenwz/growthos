/**
 * Packs the published CLI, installs the tarball in a clean directory,
 * and runs the demo. This is the closest thing to a real `npx growthos`.
 * Run with: pnpm pack:smoke
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = path.join(root, "packages", "cli");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "growthos-pack-"));

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 180_000 });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
  return result;
}

try {
  console.log("Packing growthos...");
  const pack = run("npm", ["pack", "--pack-destination", tmp, "--silent"], cliDir);
  const filename = pack.stdout.trim().split("\n").pop() ?? "";
  const tarball = path.join(tmp, filename);
  if (!fs.existsSync(tarball)) throw new Error(`Tarball not found: ${tarball}`);
  console.log(
    `Packed ${path.basename(tarball)} (${(fs.statSync(tarball).size / 1024).toFixed(0)} KB)`,
  );

  const project = path.join(tmp, "project");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(
    path.join(project, "package.json"),
    JSON.stringify({ name: "smoke", private: true }),
  );
  console.log("Installing tarball in a clean project...");
  run("npm", ["install", tarball, "--no-audit", "--no-fund", "--silent"], project);

  console.log("Running `growthos demo --no-open` from the installed package...");
  const demoDir = path.join(project, "demo");
  const demo = run(
    "npx",
    ["--no-install", "growthos", "demo", "--no-open", "--dir", demoDir],
    project,
  );
  const output = demo.stdout;
  const expected = [
    "FAIL",
    "HVAC owners want an AI SDR.",
    "PASS",
    "6 claims, 18 receipts, 4 channels.",
    "Growth OS Score: 88/100 (System)",
  ];
  for (const needle of expected) {
    if (!output.includes(needle)) {
      console.error(output);
      throw new Error(`Demo output is missing: ${needle}`);
    }
  }
  if (!fs.existsSync(path.join(demoDir, "growth", "cockpit", "index.html"))) {
    throw new Error("Cockpit was not generated.");
  }
  console.log("Pack smoke test passed.");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
