import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig, type PluginOption } from "vite";
import checker from "vite-plugin-checker";
import dts from "vite-plugin-dts";
import { dependencies } from "./package.json";

const nodeBuiltins = [...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)];

const external = [...Object.keys(dependencies), ...nodeBuiltins, "crypto", "fs", "os", "path", "stream", "util"];

const libraryEntry = resolve(__dirname, "src/index.ts");
const browserEntry = resolve(__dirname, "src/browser.ts");
const cliEntry = resolve(__dirname, "src/cli/index.ts");

const libraryPlugins: PluginOption[] = [
  checker({
    enableBuild: true,
    typescript: {
      tsconfigPath: "tsconfig.build.json",
    },
  }),
  dts({
    entryRoot: ".",
    outDirs: "dist",
    strictOutput: true,
    tsconfigPath: "tsconfig.build.json",
  }),
];

export default defineConfig(({ mode }) => {
  const isCliBuild = mode === "cli";
  const isBrowserBuild = mode === "browser";
  const isLibraryEsmBuild = mode === "library-esm";
  let entry = libraryEntry;
  let outputFileName = "index.js";
  let banner: string | undefined;
  let outputFormat: "cjs" | "es" = "cjs";

  if (isLibraryEsmBuild) {
    outputFileName = "index.mjs";
    outputFormat = "es";
    banner = `import { fileURLToPath as __webfontFileURLToPath } from "node:url";
const __filename = __webfontFileURLToPath(import.meta.url);
const __dirname = __webfontFileURLToPath(new URL(".", import.meta.url));
`;
  }

  if (isBrowserBuild) {
    entry = browserEntry;
    outputFileName = "browser.js";
    outputFormat = "es";
  }

  if (isCliBuild) {
    entry = cliEntry;
    outputFileName = "cli.mjs";
    banner = `#!/usr/bin/env node
import { fileURLToPath as __webfontFileURLToPath } from "node:url";
const __filename = __webfontFileURLToPath(import.meta.url);
const __dirname = __webfontFileURLToPath(new URL(".", import.meta.url));
`;
    outputFormat = "es";
  }

  let plugins: PluginOption[] = libraryPlugins;

  if (isCliBuild || isBrowserBuild || isLibraryEsmBuild) {
    plugins = [];
  }

  return {
    // The repo root holds a public/ folder used only by the VitePress docs site.
    // Disable Vite's public-dir copying so the library build never bundles it.
    publicDir: false,
    build: {
      emptyOutDir: !isCliBuild && !isBrowserBuild && !isLibraryEsmBuild,
      lib: {
        entry,
        fileName: () => outputFileName,
        formats: [outputFormat],
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
