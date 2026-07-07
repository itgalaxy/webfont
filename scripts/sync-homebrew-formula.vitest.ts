import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertValidVersion,
  ensureSymlink,
  PATHS,
  patchFormulaUrlAndSha256,
  resolveNpmReleaseForVersion,
  syncHomebrewFormula,
  writeGithubOutput,
} from "./sync-homebrew-formula.mjs";

const SAMPLE_FORMULA = `# typed: strict
# frozen_string_literal: true
class Webfont < Formula
  url "https://registry.npmjs.org/webfont/-/webfont-1.0.0.tgz"
  sha256 "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  license "MIT"
  depends_on "node"
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

const tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("assertValidVersion", () => {
  it("should reject missing or empty version strings", () => {
    expect(() => assertValidVersion(undefined)).toThrow(/non-empty npm version string/u);
    expect(() => assertValidVersion("")).toThrow(/non-empty npm version string/u);
    expect(() => assertValidVersion("   ")).toThrow(/non-empty npm version string/u);
  });

  it("should return a valid version string unchanged", () => {
    expect(assertValidVersion("12.4.1")).toBe("12.4.1");
  });
});

describe("patchFormulaUrlAndSha256", () => {
  it("should replace url and sha256 lines in a formula", () => {
    const next = patchFormulaUrlAndSha256(SAMPLE_FORMULA, {
      url: "https://registry.npmjs.org/webfont/-/webfont-2.0.0.tgz",
      sha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    });

    expect(next).toContain('url "https://registry.npmjs.org/webfont/-/webfont-2.0.0.tgz"');
    expect(next).toContain('sha256 "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"');
  });

  it("should throw when the formula has no url line to patch", () => {
    expect(() =>
      patchFormulaUrlAndSha256("class Webfont < Formula\nend\n", {
        url: "https://example.test/pkg.tgz",
        sha256: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      }),
    ).toThrow(/Could not patch formula url line/u);
  });
});

describe("ensureSymlink", () => {
  it("should create a relative symlink when the alias is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "webfont-homebrew-"));
    tempDirs.push(root);
    const aliasPath = join(root, "Aliases/webfonts");
    const targetPath = join(root, "HomebrewFormula/webfont.rb");

    mkdirSync(join(root, "HomebrewFormula"), { recursive: true });
    writeFileSync(targetPath, SAMPLE_FORMULA);

    ensureSymlink(aliasPath, "../HomebrewFormula/webfont.rb");

    expect(lstatSync(aliasPath).isSymbolicLink()).toBe(true);
    expect(readlinkSync(aliasPath)).toBe("../HomebrewFormula/webfont.rb");
    expect(readFileSync(targetPath, "utf8")).toBe(SAMPLE_FORMULA);
  });

  it("should not recreate a symlink that already points at the target", () => {
    const root = mkdtempSync(join(tmpdir(), "webfont-homebrew-"));
    tempDirs.push(root);
    const aliasPath = join(root, "Aliases/webfonts");

    mkdirSync(join(root, "Aliases"), { recursive: true });
    symlinkSync("../HomebrewFormula/webfont.rb", aliasPath);

    ensureSymlink(aliasPath, "../HomebrewFormula/webfont.rb");

    expect(readlinkSync(aliasPath)).toBe("../HomebrewFormula/webfont.rb");
  });
});

describe("resolveNpmReleaseForVersion", () => {
  it("should resolve npm tarball url and sha256 without writing formula files", async () => {
    const formulaBefore = readFileSync(PATHS.formula, "utf8");

    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/webfont/3.2.1")) {
          return new Response(
            JSON.stringify({
              dist: { tarball: "https://registry.npmjs.org/webfont/-/webfont-3.2.1.tgz" },
            }),
            { status: 200 },
          );
        }

        if (url.endsWith("webfont-3.2.1.tgz")) {
          return new Response(Buffer.from("fake-tarball"), { status: 200 });
        }

        return new Response("not found", { status: 404 });
      }),
    );

    const result = await resolveNpmReleaseForVersion("3.2.1");

    expect(result.version).toBe("3.2.1");
    expect(result.url).toBe("https://registry.npmjs.org/webfont/-/webfont-3.2.1.tgz");
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(readFileSync(PATHS.formula, "utf8")).toBe(formulaBefore);
  });
});

describe("writeGithubOutput", () => {
  it("should append key=value lines to GITHUB_OUTPUT", () => {
    const root = mkdtempSync(join(tmpdir(), "webfont-gh-output-"));
    tempDirs.push(root);
    const outputPath = join(root, "output.txt");

    const previous = process.env.GITHUB_OUTPUT;
    process.env.GITHUB_OUTPUT = outputPath;

    try {
      writeGithubOutput({ url: "https://example.test/pkg.tgz", sha256: "abc" });
      expect(readFileSync(outputPath, "utf8")).toBe("url=https://example.test/pkg.tgz\nsha256=abc\n");
    } finally {
      if (previous === undefined) {
        delete process.env.GITHUB_OUTPUT;
      } else {
        process.env.GITHUB_OUTPUT = previous;
      }
    }
  });

  it("should reject multiline GITHUB_OUTPUT values", () => {
    const root = mkdtempSync(join(tmpdir(), "webfont-gh-output-"));
    tempDirs.push(root);
    const outputPath = join(root, "output.txt");

    const previous = process.env.GITHUB_OUTPUT;
    process.env.GITHUB_OUTPUT = outputPath;

    try {
      expect(() => writeGithubOutput({ url: "https://example.test/a\nb.tgz" })).toThrow(/single line/u);
    } finally {
      if (previous === undefined) {
        delete process.env.GITHUB_OUTPUT;
      } else {
        process.env.GITHUB_OUTPUT = previous;
      }
    }
  });
});

describe("syncHomebrewFormula", () => {
  it("should patch HomebrewFormula/webfont.rb using mocked npm metadata", async () => {
    const root = mkdtempSync(join(tmpdir(), "webfont-homebrew-sync-"));
    tempDirs.push(root);

    const formulaDir = join(root, "HomebrewFormula");
    mkdirSync(formulaDir, { recursive: true });
    writeFileSync(join(formulaDir, "webfont.rb"), SAMPLE_FORMULA);
    mkdirSync(join(root, "packages/webfont"), { recursive: true });
    writeFileSync(join(root, "packages/webfont/package.json"), JSON.stringify({ version: "9.9.9" }));

    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input);
        if (url.endsWith("/webfont/9.9.9")) {
          return new Response(
            JSON.stringify({
              dist: { tarball: "https://registry.npmjs.org/webfont/-/webfont-9.9.9.tgz" },
            }),
            { status: 200 },
          );
        }

        if (url.endsWith("webfont-9.9.9.tgz")) {
          return new Response(Buffer.from("fake-tarball"), { status: 200 });
        }

        return new Response("not found", { status: 404 });
      }),
    );

    const result = await syncHomebrewFormula({ version: "9.9.9", repoRoot: root });

    expect(result.version).toBe("9.9.9");
    expect(result.url).toBe("https://registry.npmjs.org/webfont/-/webfont-9.9.9.tgz");

    const formula = readFileSync(join(root, "HomebrewFormula/webfont.rb"), "utf8");

    expect(formula).toContain("webfont-9.9.9.tgz");
    expect(readlinkSync(join(root, "Aliases/webfonts"))).toBe("../HomebrewFormula/webfont.rb");
  });
});
