import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { dependencies } from "./package.json";

const nodeBuiltins = [...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)];

const external = [...Object.keys(dependencies), ...nodeBuiltins, "crypto", "fs", "os", "path", "stream", "util"];

const libraryEntry = resolve(__dirname, "src/index.ts");
const cliEntry = resolve(__dirname, "src/cli/index.ts");

export default defineConfig(({ mode }) => {
  const isCliBuild = mode === "cli";
  let entry = libraryEntry;
  let outputFileName = "index.js";
  let banner: string | undefined;

  if (isCliBuild) {
    entry = cliEntry;
    outputFileName = "cli.js";
    banner = "#!/usr/bin/env node\n";
  }

  return {
    build: {
      emptyOutDir: !isCliBuild,
      lib: {
        entry,
        fileName: () => outputFileName,
        formats: ["cjs"],
      },
      outDir: "dist",
      rolldownOptions: {
        external,
        output: {
          banner,
          exports: "named",
        },
      },
      target: "es2020",
    },
  };
});
