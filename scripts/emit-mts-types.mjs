#!/usr/bin/env node
// After the CJS library build emits `dist/**/*.d.ts`, duplicate every
// declaration file to a matching `.d.mts` so `package.json#exports` can
// point the ESM `import` condition at `.d.mts` types.
//
// TypeScript's `moduleResolution: "bundler"` (and `nodenext` / `node16` in
// strict extension mode) requires the type declaration extension to match
// the runtime file extension: `.d.mts` next to `.mjs`, `.d.ts` next to
// `.js`. Our ESM and CJS builds export identical shapes, so the content is
// the same — we only need the extension to differ.

import { copyFile, readdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const DIST_DIR = join(REPO_ROOT, "dist");

async function walkDts(dir) {
  const entries = await readdir(dir);
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = await stat(full);
    if (stats.isDirectory()) {
      results.push(...(await walkDts(full)));
    } else if (entry.endsWith(".d.ts") && extname(entry) !== ".map") {
      results.push(full);
    }
  }
  return results;
}

const dtsFiles = await walkDts(DIST_DIR);
if (dtsFiles.length === 0) {
  console.error("[emit-mts-types] No .d.ts files found under dist/. Did the CJS library build run?");
  process.exit(1);
}

let copied = 0;
for (const dts of dtsFiles) {
  const mts = `${dts.slice(0, -".d.ts".length)}.d.mts`;
  await copyFile(dts, mts);
  copied += 1;
}

console.log(`[emit-mts-types] Duplicated ${copied} .d.ts → .d.mts under dist/`);
