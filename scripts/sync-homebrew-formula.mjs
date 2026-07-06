#!/usr/bin/env node
/**
 * Bump HomebrewFormula/webfont.rb url/sha256 from the npm registry.
 */
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertFormulasInSync,
  renderHomebrewCoreFormula,
} from "./render-homebrew-core-formula.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PATHS = {
  formula: join(REPO_ROOT, "HomebrewFormula/webfont.rb"),
  coreFormula: join(REPO_ROOT, "docs/homebrew-core/webfont.rb"),
  alias: join(REPO_ROOT, "Aliases/webfonts"),
  packageJson: join(REPO_ROOT, "packages/webfont/package.json"),
};

/** @param {string} content @param {{ url: string; sha256: string }} fields */
export function patchFormulaUrlAndSha256(content, { url, sha256 }) {
  const nextUrl = content.replace(/^  url ".+"$/m, `  url "${url}"`);
  if (nextUrl === content) {
    throw new Error("Could not patch formula url line");
  }

  const next = nextUrl.replace(/^  sha256 ".+"$/m, `  sha256 "${sha256}"`);
  if (next === nextUrl) {
    throw new Error("Could not patch formula sha256 line");
  }

  return next;
}

/** @param {string} version */
export async function resolveNpmTarballUrl(version) {
  const response = await fetch(`https://registry.npmjs.org/webfont/${version}`);
  if (!response.ok) {
    throw new Error(`npm registry returned ${response.status} for webfont@${version}`);
  }

  const metadata = await response.json();
  const tarball = metadata?.dist?.tarball;
  if (typeof tarball !== "string" || tarball.length === 0) {
    throw new Error(`npm metadata for webfont@${version} has no dist.tarball`);
  }

  return tarball;
}

/** @param {string} url */
export async function fetchTarballSha256(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download tarball (${response.status}): ${url}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * @param {string} linkPath
 * @param {string} targetRelative
 */
export function ensureSymlink(linkPath, targetRelative) {
  mkdirSync(dirname(linkPath), { recursive: true });

  try {
    const stat = lstatSync(linkPath);
    if (stat.isSymbolicLink() && readlinkSync(linkPath) === targetRelative) {
      return;
    }

    unlinkSync(linkPath);
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== "ENOENT") {
      throw error;
    }
  }

  symlinkSync(targetRelative, linkPath);
}

/**
 * @param {{ version?: string; repoRoot?: string }} [options]
 */
export async function syncHomebrewFormula(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const paths = {
    formula: join(repoRoot, "HomebrewFormula/webfont.rb"),
    coreFormula: join(repoRoot, "docs/homebrew-core/webfont.rb"),
    alias: join(repoRoot, "Aliases/webfonts"),
    packageJson: join(repoRoot, "packages/webfont/package.json"),
  };

  let version = options.version;
  if (!version) {
    const packageJson = JSON.parse(readFileSync(paths.packageJson, "utf8"));
    version = packageJson.version;
  }

  const url = await resolveNpmTarballUrl(version);
  const sha256 = await fetchTarballSha256(url);

  const current = readFileSync(paths.formula, "utf8");
  const updated = patchFormulaUrlAndSha256(current, { url, sha256 });
  writeFileSync(paths.formula, updated);

  mkdirSync(dirname(paths.coreFormula), { recursive: true });
  const coreFormula = renderHomebrewCoreFormula({ url, sha256 });
  writeFileSync(paths.coreFormula, coreFormula);
  assertFormulasInSync(updated, coreFormula);

  ensureSymlink(paths.alias, "../HomebrewFormula/webfont.rb");

  return { version, url, sha256 };
}

function readVersionArg(argv) {
  const flagIndex = argv.indexOf("--version");
  if (flagIndex === -1) {
    return undefined;
  }

  const value = argv[flagIndex + 1];
  if (!value || value.startsWith("-")) {
    throw new Error("Missing value for --version");
  }

  return value;
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const version = readVersionArg(process.argv);
  const result = await syncHomebrewFormula({ version });
  process.stdout.write(
    `Synced Homebrew formula to webfont@${result.version}\n` +
      `  url: ${result.url}\n` +
      `  sha256: ${result.sha256}\n`,
  );
}
