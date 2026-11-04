/**
 * Generates the public JSON Schemas for the Growth Repo Spec.
 * Run with: pnpm schemas
 * Check with: pnpm schemas:check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ConfigSchema,
  EvalSchema,
  ExperimentSchema,
  JobSchema,
  MemoSchema,
  SignalSchema,
} from "../packages/core/src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "spec", "schemas");
const check = process.argv.includes("--check");

const SCHEMAS = [
  { name: "config", schema: ConfigSchema, title: "growthOS config" },
  { name: "signal", schema: SignalSchema, title: "growthOS signal" },
  { name: "memo", schema: MemoSchema, title: "growthOS memo" },
  { name: "experiment", schema: ExperimentSchema, title: "growthOS experiment" },
  { name: "job", schema: JobSchema, title: "growthOS job spec" },
  { name: "eval", schema: EvalSchema, title: "growthOS eval" },
] as const;

let mismatches = 0;
fs.mkdirSync(outDir, { recursive: true });

for (const entry of SCHEMAS) {
  const json = zodToJsonSchema(entry.schema, {
    name: entry.name,
    $refStrategy: "root",
  }) as Record<string, unknown>;
  json.$schema = "https://json-schema.org/draft/2020-12/schema";
  json.title = entry.title;
  json.$id = `https://growthos.dev/schemas/${entry.name}.schema.json`;
  const content = `${JSON.stringify(json, null, 2)}\n`;
  const file = path.join(outDir, `${entry.name}.schema.json`);
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (previous !== content) {
    mismatches += 1;
    if (check) {
      console.error(`changed: spec/schemas/${entry.name}.schema.json`);
    } else {
      fs.writeFileSync(file, content);
      console.log(`wrote: spec/schemas/${entry.name}.schema.json`);
    }
  }
}

const index = {
  spec: "growthos/growth-repo@0.1",
  schemas: SCHEMAS.map((entry) => ({
    name: entry.name,
    url: `https://growthos.dev/schemas/${entry.name}.schema.json`,
    file: `spec/schemas/${entry.name}.schema.json`,
  })),
};
const indexPath = path.join(outDir, "index.json");
const indexContent = `${JSON.stringify(index, null, 2)}\n`;
if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, "utf8") !== indexContent) {
  mismatches += 1;
  if (check) console.error("changed: spec/schemas/index.json");
  else fs.writeFileSync(indexPath, indexContent);
}

if (check) {
  if (mismatches > 0) {
    console.error(`\n${mismatches} schema file(s) are stale. Run \`pnpm schemas\`.`);
    process.exitCode = 1;
  } else {
    console.log("Schemas are up to date.");
  }
} else {
  console.log(`Generated ${SCHEMAS.length} schemas in spec/schemas/.`);
}
