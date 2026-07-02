import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig, type PluginOption } from "vite";
import checker from "vite-plugin-checker";
import dts from "vite-plugin-dts";
import { dependencies } from "./package.json";

const nodeBuiltins = [...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)];

const external = [...Object.keys(dependencies), ...nodeBuiltins, "crypto", "fs", "os", "path", "stream", "util"];

const libraryEntry = resolve(__dirname, "src/index.ts");
const cliEntry = resolve(__dirname, "src/cli/index.ts");

const libraryPlugins: PluginOption[] = [
  checker({
    enableBuild: true,
    typescript: {
      tsconfigPath: "tsconfig.json",
    },
  }),
  dts({
    entryRoot: ".",
    outDirs: "dist",
    strictOutput: true,
    tsconfigPath: "tsconfig.json",
  }),
];

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

  let plugins: PluginOption[] = libraryPlugins;

  if (isCliBuild) {
    plugins = [];
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
    plugins,
  };
});
