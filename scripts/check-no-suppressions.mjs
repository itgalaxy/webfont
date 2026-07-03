#!/usr/bin/env node
// Fails when banned lint/type suppressions appear in tracked source files.
// Rationale: this repo uses Biome (not ESLint) and forbids silencing the
// type checker — see AGENTS.md "Lint and type hygiene" and ADR 0001.
//
// The forbidden tokens are assembled from fragments on purpose so this checker
// never matches itself (and neither does the AGENTS.md `rg` hygiene command).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SELF = "scripts/check-no-suppressions.mjs";

const BANNED = [
  { label: "eslint-" + "disable", re: /eslint-disable/u, hint: "ESLint is not used; delete stale suppressions (ADR 0001)." },
  { label: "@ts-" + "ignore", re: /@ts-ignore\b/u, hint: "Resolve the type instead of ignoring it (AGENTS.md)." },
  { label: "@ts-" + "expect-error", re: /@ts-expect-error\b/u, hint: "Use a typed cast/helper; prefer rejects.toThrow for async (AGENTS.md)." },
  { label: "@ts-" + "nocheck", re: /@ts-nocheck\b/u, hint: "Do not disable type checking for a whole file." },
  { label: "ignore" + "Deprecations", re: /ignoreDeprecations/u, hint: "Migrate deprecated compiler options instead of silencing them (AGENTS.md)." },
];

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

const isScannable = (file) => {
  if (file === SELF) {
    return false;
  }

  if (/(^|\/)tsconfig[^/]*\.json$/u.test(file)) {
    return true;
  }

  return CODE_EXTENSIONS.some((ext) => file.endsWith(ext));
};

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter(isScannable);

const violations = [];

for (const file of trackedFiles) {
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((line, index) => {
    for (const rule of BANNED) {
      if (rule.re.test(line)) {
        violations.push({ file, line: index + 1, rule });
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`Found ${violations.length} banned lint/type suppression(s):\n`);

  for (const { file, line, rule } of violations) {
    console.error(`  ${file}:${line}  ${rule.label}\n    → ${rule.hint}`);
  }

  console.error("\nSee AGENTS.md § 'Lint and type hygiene'. Use biome-ignore only when unavoidable.");
  process.exit(1);
}

console.log(`No banned suppressions in ${trackedFiles.length} tracked source files.`);
