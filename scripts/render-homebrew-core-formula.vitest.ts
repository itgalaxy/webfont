import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertFormulasInSync,
  extractFormulaFields,
  renderHomebrewCoreFormula,
  renderHomebrewCoreFromTap,
} from "./render-homebrew-core-formula.mjs";

const TAP_SAMPLE = `# typed: strict
class Webfont < Formula
  url "https://registry.npmjs.org/webfont/-/webfont-1.0.0.tgz"
  sha256 "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end
  test do
    system bin/"webfont", testpath/"icon.svg", "-d", testpath, "-f", "woff2"
    assert_path_exists testpath/"webfont.woff2"
  end
end
`;

describe("renderHomebrewCoreFormula", () => {
  it("should render a homebrew-core formula with npm url and sha256", () => {
    const rendered = renderHomebrewCoreFormula({
      url: "https://registry.npmjs.org/webfont/-/webfont-2.0.0.tgz",
      sha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    });

    expect(rendered).toContain('url "https://registry.npmjs.org/webfont/-/webfont-2.0.0.tgz"');
    expect(rendered).toContain('sha256 "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"');
    expect(rendered).toContain('homepage "https://webfont.js.org/"');
    expect(rendered).toContain('libexec.glob("bin/*")');
    expect(rendered).toContain('shell_output("#{bin}/webfont --version")');
    expect(rendered).not.toContain("brew tap");
  });
});

describe("assertFormulasInSync", () => {
  it("should accept tap and core formulas with matching url and sha256", () => {
    const core = renderHomebrewCoreFormula({
      url: "https://registry.npmjs.org/webfont/-/webfont-1.0.0.tgz",
      sha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });

    expect(() => assertFormulasInSync(TAP_SAMPLE, core)).not.toThrow();
  });

  it("should reject formulas when url or sha256 differ", () => {
    const core = renderHomebrewCoreFormula({
      url: "https://registry.npmjs.org/webfont/-/webfont-9.9.9.tgz",
      sha256: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    });

    expect(() => assertFormulasInSync(TAP_SAMPLE, core)).toThrow(/mismatch/u);
  });
});

describe("renderHomebrewCoreFromTap", () => {
  it("should render homebrew-core output from HomebrewFormula/webfont.rb", () => {
    const tapPath = join(process.cwd(), "HomebrewFormula/webfont.rb");
    const core = renderHomebrewCoreFromTap(tapPath);

    assertFormulasInSync(readFileSync(tapPath, "utf8"), core);

    const fields = extractFormulaFields(core);
    expect(fields.url).toMatch(/^https:\/\/registry\.npmjs\.org\/webfont\/-/u);
  });
});
