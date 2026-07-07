import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const repoRoot = resolve(__dirname, "../..");
const webfontRoot = resolve(__dirname, "../webfont");
const publicDemoDir = resolve(repoRoot, "public/demo");
const polyfillShimsRoot = resolve(repoRoot, "node_modules/vite-plugin-node-polyfills/shims");
const iconsDirStub = resolve(__dirname, "stubs/svgicons2svgfont-iconsdir.ts");

const stubSvgiconsIconsDir: Plugin = {
  name: "stub-svgicons2svgfont-iconsdir",
  resolveId(source, importer) {
    if (source.endsWith("iconsdir.js") && importer?.includes("svgicons2svgfont")) {
      return iconsDirStub;
    }

    return undefined;
  },
};

export default defineConfig({
  base: "/demo/",
  root: __dirname,
  resolve: {
    alias: {
      "@webfont": resolve(webfontRoot, "src"),
      "vite-plugin-node-polyfills/shims/buffer": resolve(polyfillShimsRoot, "buffer/dist/index.js"),
      "vite-plugin-node-polyfills/shims/process": resolve(polyfillShimsRoot, "process/dist/index.js"),
      "vite-plugin-node-polyfills/shims/global": resolve(polyfillShimsRoot, "global/dist/index.js"),
    },
  },
  plugins: [
    nodePolyfills({
      exclude: ["fs", "child_process", "http", "https", "net", "tls", "dns"],
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    }),
    stubSvgiconsIconsDir,
  ],
  optimizeDeps: {
    include: ["esm-potrace-wasm", "@xmldom/xmldom"],
  },
  build: {
    outDir: publicDemoDir,
    emptyOutDir: true,
  },
  server: {
    port: 3333,
    open: "/demo/",
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        lib: ["ES2020", "DOM", "DOM.Iterable"],
      },
    },
  },
});
