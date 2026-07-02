import path from "node:path";
import { defineConfig } from "vitest/config";

const esmNodeModules = [
  "meow",
  "p-limit",
  "svgicons2svgfont",
  "svg-pathdata",
  "transformation-matrix",
  "yerror",
  "yocto-queue",
  "is-svg",
  "@file-type/xml",
  "strtok3",
  "peek-readable",
  "@tokenizer/token",
];

export default defineConfig({
  resolve: {
    alias: {
      globby: path.resolve(__dirname, "vitest/globby-stub.ts"),
      "@file-type/xml": path.resolve(__dirname, "node_modules/@file-type/xml/lib/index.js"),
    },
  },
  test: {
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["json"],
      reportsDirectory: "coverage",
    },
    environment: "node",
    exclude: ["**/node_modules/**", "**/.github/**", "**/coverage/**", "**/dist/**", "**/temp/**"],
    globals: true,
    include: ["src/**/*.test.ts"],
    name: "Webfont",
    server: {
      deps: {
        inline: esmNodeModules,
      },
    },
    testTimeout: 10_000,
  },
});
