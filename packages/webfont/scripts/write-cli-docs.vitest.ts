import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderCliMarkdownDoc } from "../src/cli/meow/renderCliHelp";

const PACKAGE_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CLI_DOCS_PATH = resolve(PACKAGE_ROOT, "docs/cli.md");

describe("write-cli-docs", () => {
  it("should write packages/webfont/docs/cli.md from cliFlagCatalog metadata", () => {
    const next = renderCliMarkdownDoc();
    let current = "";

    if (existsSync(CLI_DOCS_PATH)) {
      current = readFileSync(CLI_DOCS_PATH, "utf8");
    }

    if (current === next) {
      expect(readFileSync(CLI_DOCS_PATH, "utf8")).toBe(next);
      return;
    }

    writeFileSync(CLI_DOCS_PATH, next);
    expect(readFileSync(CLI_DOCS_PATH, "utf8")).toBe(next);
  });
});
