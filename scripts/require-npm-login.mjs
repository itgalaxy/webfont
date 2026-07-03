#!/usr/bin/env node

// Fail fast on a local `npm publish` when you are not authenticated, so the
// heavy `prepublishOnly` steps (build + package validation) do not run only to
// fail on authentication at the very end.
//
// Skipped in CI: the npm publish workflow authenticates via the NPM_TOKEN
// secret (or Trusted Publishing / OIDC), where `npm whoami` is not the right
// signal and could differ per token type. See .github/workflows/npm-publish.yml.

import { spawnSync } from "node:child_process";

if (process.env.CI) {
  process.exit(0);
}

const result = spawnSync("npm", ["whoami"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  const detail = (result.stderr || "").trim();

  console.error(
    [
      "",
      "Error: not logged in to npm — aborting before build + package validation.",
      "Run `npm login` (or configure a valid token), then `npm publish` again.",
      detail ? `npm: ${detail}` : "",
      "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  process.exit(1);
}

console.log(`npm: authenticated as ${result.stdout.trim()} — proceeding with publish validation.`);
