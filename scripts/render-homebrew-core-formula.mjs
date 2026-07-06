#!/usr/bin/env node
/**
 * Render a homebrew-core Formula/w/webfont.rb from HomebrewFormula/webfont.rb.
 *
 * Usage:
 *   node scripts/render-homebrew-core-formula.mjs              # stdout
 *   node scripts/render-homebrew-core-formula.mjs > webfont.rb # save for core PR
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TAP_FORMULA = join(REPO_ROOT, "HomebrewFormula/webfont.rb");

/** @param {{ url: string; sha256: string }} fields */
export function renderHomebrewCoreFormula({ url, sha256 }) {
  return `# typed: strict
# frozen_string_literal: true

class Webfont < Formula
  desc "Generator of fonts from SVG icons, with TTF encoding and WOFF/WOFF2 decoding"
  homepage "https://webfont.js.org/"
  url "${url}"
  sha256 "${sha256}"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    (testpath/"icon.svg").write <<~SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2 2h12v12H2z"/></svg>
    SVG

    system bin/"webfont", testpath/"icon.svg", "-d", testpath, "-f", "woff2"
    assert_path_exists testpath/"webfont.woff2"
    assert_match version.to_s, shell_output("#{bin}/webfont --version")
  end
end
`;
}

/** @param {string} content */
export function extractFormulaFields(content) {
  const urlMatch = content.match(/^  url "(.+)"$/m);
  const shaMatch = content.match(/^  sha256 "(.+)"$/m);

  if (!urlMatch || !shaMatch) {
    throw new Error("Could not extract url/sha256 from formula");
  }

  return {
    url: urlMatch[1],
    sha256: shaMatch[1],
  };
}

/** @param {string} tapFormula @param {string} coreFormula */
export function assertFormulasInSync(tapFormula, coreFormula) {
  const tap = extractFormulaFields(tapFormula);
  const core = extractFormulaFields(coreFormula);

  if (tap.url !== core.url || tap.sha256 !== core.sha256) {
    throw new Error(
      `Tap/core url/sha256 mismatch:\n  tap:  ${tap.url}\n  core: ${core.url}`,
    );
  }

  for (const block of ["def install", "test do", 'libexec.glob("bin/*")', "woff2"]) {
    if (!tapFormula.includes(block) || !coreFormula.includes(block)) {
      throw new Error(`Missing expected Homebrew block: ${block}`);
    }
  }
}

/** @param {string} [tapFormulaPath] */
export function renderHomebrewCoreFromTap(tapFormulaPath = TAP_FORMULA) {
  const tapFormula = readFileSync(tapFormulaPath, "utf8");
  const fields = extractFormulaFields(tapFormula);
  const coreFormula = renderHomebrewCoreFormula(fields);
  assertFormulasInSync(tapFormula, coreFormula);
  return coreFormula;
}

const isMain =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  process.stdout.write(renderHomebrewCoreFromTap());
}
