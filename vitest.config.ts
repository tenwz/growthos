import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@growthos/core": `${root}packages/core/src/index.ts`,
      "@growthos/mcp": `${root}packages/mcp/src/index.ts`,
    },
  },
  test: {
    include: ["packages/**/test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/fixtures/**"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
