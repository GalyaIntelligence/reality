import { defineConfig } from "vitest/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Resolve TypeScript sources for NodeNext-style `.js` import specifiers. */
function resolveJsToTs() {
  return {
    name: "resolve-js-to-ts",
    enforce: "pre" as const,
    async resolveId(source: string, importer: string | undefined) {
      if (!importer || !source.endsWith(".js")) return null;
      if (!source.startsWith(".") && !source.startsWith("/")) return null;
      const abs = path.resolve(path.dirname(importer), source);
      const asTs = abs.replace(/\.js$/, ".ts");
      if (fs.existsSync(asTs)) return asTs;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [resolveJsToTs()],
  test: {
    globals: false,
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@galya/reality": path.join(root, "src/index.ts"),
    },
  },
});
