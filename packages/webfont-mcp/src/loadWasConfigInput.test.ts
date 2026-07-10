import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadWasConfigsFromInput } from "./loadWasConfigInput.js";
import { getWorkspaceRoot } from "./pathSandbox.js";

const repoRoot = getWorkspaceRoot(join(import.meta.dirname, "../../.."));

const fixtureWasJson = JSON.stringify({
  dest: "packages/webfont-mcp/.tmp/was-validate-dest",
  files: "packages/webfont/src/fixtures/svg-icons/*.svg",
  name: "FixtureFont",
  prefix: "fixture-icon",
  formats: ["woff2"],
  template: "css",
});

describe("loadWasConfigsFromInput", () => {
  it("should reject when both wasConfigPath and wasConfigJson are provided", async () => {
    await expect(
      loadWasConfigsFromInput({
        wasConfigJson: "{}",
        wasConfigPath: "config.was",
        workspaceRoot: repoRoot,
      }),
    ).rejects.toThrow(/exactly one/u);
  });

  it("should reject when neither wasConfigPath nor wasConfigJson is provided", async () => {
    await expect(loadWasConfigsFromInput({ workspaceRoot: repoRoot })).rejects.toThrow(/exactly one/u);
  });

  it("should parse inline wasConfigJson and sandbox dest/files within workspaceRoot", async () => {
    const loaded = await loadWasConfigsFromInput({
      wasConfigJson: fixtureWasJson,
      workspaceRoot: repoRoot,
    });

    expect(loaded.configLabel).toBe("<inline>");
    expect(loaded.configs).toHaveLength(1);
    expect(loaded.configs[0]?.dest).toContain("packages/webfont-mcp/.tmp/was-validate-dest");
    expect(loaded.configs[0]?.files).toContain("packages/webfont/src/fixtures/svg-icons/*.svg");
  });
});
