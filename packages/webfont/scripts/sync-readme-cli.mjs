#!/usr/bin/env node
// Sync README.md CLI Usage from packages/webfont/src/cli/meow/cliHelpText.ts.
// Run: npm run docs:cli (repo root) after changing CLI help text.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webfontCliHelpText } from "../src/cli/meow/cliHelpText.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const README_PATH = resolve(REPO_ROOT, "README.md");

const BEGIN = "<!-- cli-help:begin -->";
const END = "<!-- cli-help:end -->";

const readme = readFileSync(README_PATH, "utf8");
const pattern = new RegExp(`${BEGIN}[\\s\\S]*?${END}`, "u");

if (!pattern.test(readme)) {
  console.error(`[sync-readme-cli] README.md is missing the ${BEGIN} … ${END} block.`);
  process.exit(1);
}

const replacement = `${BEGIN}
\`\`\`shell${webfontCliHelpText}
\`\`\`
${END}`;

const next = readme.replace(pattern, replacement);
if (next === readme) {
  console.log("[sync-readme-cli] README.md CLI section is already up to date.");
} else {
  writeFileSync(README_PATH, next);
  console.log("[sync-readme-cli] Updated README.md CLI Usage from cliHelpText.mjs");
}
