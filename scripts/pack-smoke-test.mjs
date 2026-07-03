#!/usr/bin/env node
// Pack the current webfont build, install the tarball into throwaway ESM and
// CJS consumer projects, and assert both import shapes work end-to-end. This
// guards `package.json#exports`, `files`, and the built dist/*.mjs and
// dist/*.js against regressions like #618 (default ESM import was not
// callable) that unit tests against `src/` cannot catch.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const FIXTURES_GLOB = resolve(REPO_ROOT, "src/fixtures/svg-icons/*.svg");

const log = (message) => console.log(`[pack-smoke] ${message}`);

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
  });

const runCapture = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

const writePackageJson = (dir, contents) => {
  writeFileSync(join(dir, "package.json"), `${JSON.stringify(contents, null, 2)}\n`);
};

let workDir;
let tarballPath;

try {
  workDir = mkdtempSync(join(tmpdir(), "webfont-pack-"));
  const packDir = join(workDir, "tarball");
  const esmDir = join(workDir, "esm-consumer");
  const cjsDir = join(workDir, "cjs-consumer");
  mkdirSync(packDir);
  mkdirSync(esmDir);
  mkdirSync(cjsDir);

  log(`Working directory: ${workDir}`);
  log("Packing webfont with `npm pack` (into isolated tarball dir)");
  const packJson = runCapture(
    "npm",
    ["pack", "--json", `--pack-destination=${packDir}`, "--ignore-scripts"],
    REPO_ROOT,
  );
  const packInfo = JSON.parse(packJson);
  if (!Array.isArray(packInfo) || packInfo.length === 0 || !packInfo[0].filename) {
    throw new Error("`npm pack --json` returned unexpected output");
  }
  tarballPath = join(packDir, packInfo[0].filename);
  log(`Tarball: ${tarballPath}`);

  const tarballFiles = new Set(packInfo[0].files.map((entry) => entry.path));
  const mustShip = ["dist/index.js", "dist/index.mjs", "dist/browser.js", "dist/cli.mjs"];
  const missing = mustShip.filter((file) => !tarballFiles.has(file));
  if (missing.length > 0) {
    throw new Error(`Tarball is missing required entry points: ${missing.join(", ")}`);
  }
  log(`Tarball contains ${tarballFiles.size} files, including all required entry points`);

  writePackageJson(esmDir, { name: "webfont-pack-esm-consumer", private: true, type: "module" });
  writePackageJson(cjsDir, { name: "webfont-pack-cjs-consumer", private: true });

  log("Installing tarball into ESM consumer");
  run("npm", ["install", "--no-audit", "--no-fund", "--silent", tarballPath], esmDir);

  log("Installing tarball into CJS consumer");
  run("npm", ["install", "--no-audit", "--no-fund", "--silent", tarballPath], cjsDir);

  const esmSmoke = `import webfontDefault, { webfont as webfontNamed } from "webfont";

const errors = [];
if (typeof webfontDefault !== "function") {
  errors.push("ESM default import is " + typeof webfontDefault + " (want function)");
}
if (typeof webfontNamed !== "function") {
  errors.push("ESM named import is " + typeof webfontNamed + " (want function)");
}
if (errors.length === 0) {
  const result = await webfontDefault({
    files: ${JSON.stringify(FIXTURES_GLOB)},
    formats: ["woff2"],
  });
  if (!result.woff2 || result.woff2.length === 0) {
    errors.push("ESM default import did not produce a woff2 buffer");
  }
}
if (errors.length > 0) {
  console.error(errors.join("\\n"));
  process.exit(1);
}
console.log("esm-consumer OK");
`;
  writeFileSync(join(esmDir, "smoke.mjs"), esmSmoke);
  log("Running ESM consumer smoke test (default + named import, generate woff2)");
  run("node", ["smoke.mjs"], esmDir);

  const cjsSmoke = `const webfontModule = require("webfont");

const errors = [];
if (typeof webfontModule.webfont !== "function") {
  errors.push("CJS named export webfont is " + typeof webfontModule.webfont + " (want function)");
}
if (typeof webfontModule.default !== "function") {
  errors.push("CJS default export is " + typeof webfontModule.default + " (want function)");
}

(async () => {
  if (errors.length === 0) {
    const result = await webfontModule.webfont({
      files: ${JSON.stringify(FIXTURES_GLOB)},
      formats: ["woff2"],
    });
    if (!result.woff2 || result.woff2.length === 0) {
      errors.push("CJS require did not produce a woff2 buffer");
    }
  }
  if (errors.length > 0) {
    console.error(errors.join("\\n"));
    process.exit(1);
  }
  console.log("cjs-consumer OK");
})();
`;
  writeFileSync(join(cjsDir, "smoke.cjs"), cjsSmoke);
  log("Running CJS consumer smoke test (require default + named, generate woff2)");
  run("node", ["smoke.cjs"], cjsDir);

  log("All pack-smoke checks passed");
} catch (error) {
  console.error(`[pack-smoke] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (workDir) {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn(
        `[pack-smoke] warning: failed to clean up ${workDir}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
      );
    }
  }
}
