import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildInverseRewrites,
  resolvePageSourcePath,
  rewriteMarkdownHref,
} from "./rewriteMarkdownLinks.mts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = "https://github.com/itgalaxy/webfont";

const rewrites = {
  "README.md": "introduction/getting-started.md",
  "FEATURES.md": "introduction/features.md",
  "TROUBLESHOOTING.md": "introduction/troubleshooting.md",
  "NOTICE.md": "introduction/licenses.md",
  "MIGRATION.md": "migrating/index.md",
  "packages/webfont/install.md": "introduction/install.md",
  "packages/webfont/docs/configuration.md": "introduction/configuration.md",
  "packages/webfont/CHANGELOG.md": "introduction/whats-new.md",
  "packages/webfont/docs/cli.md": "introduction/cli.md",
  "docs/migration/issue-0618-esm-default-import.md": "migrating/issue-0618-esm-default-import.md",
};

const staticLinks = {
  LICENSE: `${repo}/blob/master/LICENSE`,
};

describe("rewriteMarkdownLinks", () => {
  it("should resolve page source from VitePress relativePath env", () => {
    const inverse = buildInverseRewrites(rewrites);

    expect(resolvePageSourcePath({ relativePath: "introduction/getting-started.md" }, inverse)).toBe("README.md");
  });

  it("should map install links from the rewritten getting-started page to /introduction/install", () => {
    expect(rewriteMarkdownHref("./packages/webfont/install.md", "README.md", rewrites, repoRoot)).toBe("/introduction/install");
  });

  it("should rewrite links without a .md extension after cleanUrls", () => {
    expect(rewriteMarkdownHref("./FEATURES", "README.md", rewrites, repoRoot)).toBe("/introduction/features");
    expect(rewriteMarkdownHref("./TROUBLESHOOTING#icon-details-missing-after-export", "README.md", rewrites, repoRoot)).toBe(
      "/introduction/troubleshooting#icon-details-missing-after-export",
    );
  });

  it("should rewrite NOTICE.md alias and LICENSE to static targets", () => {
    expect(rewriteMarkdownHref("./NOTICE.md", "README.md", rewrites, repoRoot)).toBe("/introduction/licenses");
    expect(rewriteMarkdownHref("./LICENSE", "README.md", rewrites, repoRoot, staticLinks)).toBe(`${repo}/blob/master/LICENSE`);
  });

  it("should preserve hash fragments when rewriting configuration links", () => {
    expect(
      rewriteMarkdownHref(
        "./packages/webfont/docs/configuration.md#ttfpostprocess",
        "README.md",
        rewrites,
        repoRoot,
      ),
    ).toBe("/introduction/configuration#ttfpostprocess");
  });

  it("should rewrite migration and changelog links from README", () => {
    expect(rewriteMarkdownHref("./MIGRATION.md", "README.md", rewrites, repoRoot)).toBe("/migrating/");
    expect(rewriteMarkdownHref("./docs/migration/issue-0618-esm-default-import.md", "README.md", rewrites, repoRoot)).toBe(
      "/migrating/issue-0618-esm-default-import",
    );
    expect(rewriteMarkdownHref("./packages/webfont/CHANGELOG.md", "README.md", rewrites, repoRoot)).toBe("/introduction/whats-new");
  });

  it("should leave external URLs unchanged", () => {
    expect(rewriteMarkdownHref("https://example.com", "README.md", rewrites, repoRoot)).toBe("https://example.com");
  });
});
