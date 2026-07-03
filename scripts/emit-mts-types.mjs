#!/usr/bin/env node
// After the CJS library build emits `dist/**/*.d.ts`, duplicate every
// declaration file to a matching `.d.mts` and rewrite each `.d.mts` so
// every relative import specifier ends in an explicit `.mjs` extension.
//
// Why the extension rewrite:
//   TypeScript's `nodenext` / `node16` module resolution rejects
//   extension-less specifiers inside `.d.mts` files. Vite's dts plugin
//   emits `.d.ts` with bare specifiers like `from "./standalone"`,
//   which is fine for CJS (bundler / node10) but errors as
//   `InternalResolutionError` under node16 (from ESM). The `.mjs`
//   specifier tells TS to look for a matching `.d.mts` (and Node would
//   look for a `.mjs` runtime file, but the runtime uses a single
//   bundled `dist/index.mjs` reached via `package.json#exports`, so
//   the specifier is only used by TypeScript for type resolution).
//
// Why the sibling `.d.ts` files stay: the `require` and `default`
// conditions in `package.json#exports` point at `dist/src/index.d.ts`
// and consumers on CJS / bundler / node10 keep resolving those.

import { copyFile, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
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

async function pathExists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(candidate) {
  try {
    const s = await stat(candidate);
    return s.isDirectory();
  } catch {
    return false;
  }
}

const HAS_EXTENSION = /\.(?:mjs|js|json|d\.mts|d\.ts)$/u;

async function resolveMtsSpecifier(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  if (HAS_EXTENSION.test(specifier)) return null;

  const fromDir = dirname(fromFile);
  const resolved = resolve(fromDir, specifier);

  if (await pathExists(`${resolved}.d.mts`)) {
    return `${specifier}.mjs`;
  }

  if (await isDirectory(resolved)) {
    if (await pathExists(join(resolved, "index.d.mts"))) {
      return `${specifier.replace(/\/$/u, "")}/index.mjs`;
    }
  }

  return null;
}

const SPECIFIER_PATTERN =
  /(\bfrom\s*|\bimport\s*|\bexport\s*(?:\*|\{[^}]*\})?\s*from\s*|\brequire\s*\(\s*)(["'])(\.{1,2}\/[^"']+)\2/gu;

async function rewriteMtsFile(file) {
  const source = await readFile(file, "utf8");
  const matches = [...source.matchAll(SPECIFIER_PATTERN)];
  if (matches.length === 0) return { rewritten: 0, unresolved: [] };

  let rewritten = 0;
  const unresolved = [];
  let output = "";
  let cursor = 0;

  for (const match of matches) {
    const [full, prefix, quote, specifier] = match;
    const start = match.index;
    output += source.slice(cursor, start);
    const target = await resolveMtsSpecifier(file, specifier);
    if (target) {
      output += `${prefix}${quote}${target}${quote}`;
      rewritten += 1;
    } else {
      output += full;
      if (specifier.startsWith(".") && !HAS_EXTENSION.test(specifier)) {
        unresolved.push(specifier);
      }
    }
    cursor = start + full.length;
  }
  output += source.slice(cursor);

  if (output !== source) {
    await writeFile(file, output);
  }
  return { rewritten, unresolved };
}

const dtsFiles = await walkDts(DIST_DIR);
if (dtsFiles.length === 0) {
  console.error("[emit-mts-types] No .d.ts files found under dist/. Did the CJS library build run?");
  process.exit(1);
}

let copied = 0;
const mtsFiles = [];
for (const dts of dtsFiles) {
  const mts = `${dts.slice(0, -".d.ts".length)}.d.mts`;
  await copyFile(dts, mts);
  mtsFiles.push(mts);
  copied += 1;
}

let totalRewritten = 0;
const allUnresolved = [];
for (const mts of mtsFiles) {
  const { rewritten, unresolved } = await rewriteMtsFile(mts);
  totalRewritten += rewritten;
  for (const specifier of unresolved) {
    allUnresolved.push({ file: mts, specifier });
  }
}

console.log(
  `[emit-mts-types] Duplicated ${copied} .d.ts → .d.mts; rewrote ${totalRewritten} relative import specifiers to explicit .mjs`,
);

if (allUnresolved.length > 0) {
  console.error(
    `[emit-mts-types] FAILED: ${allUnresolved.length} relative import(s) in .d.mts files could not be resolved to a matching .d.mts. This will break node16 (from ESM) types resolution:`,
  );
  for (const { file, specifier } of allUnresolved) {
    console.error(`  ${file}: ${specifier}`);
  }
  process.exit(1);
}
