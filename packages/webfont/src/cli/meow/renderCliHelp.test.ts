import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderCliMarkdownDoc, WEBFONT_CLI_HELP_MARKERS, webfontCliHelpText } from "./renderCliHelp";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../../");
const CLI_DOCS_PATH = resolve(REPO_ROOT, "docs/cli.md");

describe("renderCliHelp", () => {
  it("should keep help text markers in sync with the documented CLI options", () => {
    for (const marker of WEBFONT_CLI_HELP_MARKERS) {
      expect(webfontCliHelpText).toContain(marker);
    }
  });

  it("should keep docs/cli.md aligned with renderCliMarkdownDoc", () => {
    const expected = renderCliMarkdownDoc();

    expect(existsSync(CLI_DOCS_PATH)).toBe(true);
    expect(readFileSync(CLI_DOCS_PATH, "utf8")).toBe(expected);
  });
});
