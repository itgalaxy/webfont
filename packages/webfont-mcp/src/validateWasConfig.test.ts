import { join } from "node:path";
import { getWorkspaceRoot } from "./pathSandbox.js";
import { validateWasConfig } from "./validateWasConfig.js";

const repoRoot = getWorkspaceRoot(join(import.meta.dirname, "../../.."));

const fixtureWasJson = JSON.stringify({
  dest: "packages/webfont-mcp/.tmp/was-validate-dest",
  files: "packages/webfont/src/fixtures/svg-icons/*.svg",
  name: "FixtureFont",
  prefix: "fixture-icon",
  formats: ["woff2"],
  template: "css",
});

describe("validateWasConfig", () => {
  it("should return sandboxed configs and mapped webfont options without running webfont", async () => {
    const result = await validateWasConfig({
      wasConfigJson: fixtureWasJson,
      workspaceRoot: repoRoot,
    });

    expect(result.configLabel).toBe("<inline>");
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.was.name).toBe("FixtureFont");
    expect(result.entries[0]?.mappedOptions.templateClassName).toBe("fixture-icon");
    expect(result.entries[0]?.mappedOptions.formats).toEqual(["woff2"]);
    expect(result.entries[0]?.mappedOptions.destCreate).toBe(true);
  });

  it("should reject invalid wasConfigJson with a guard error", async () => {
    await expect(
      validateWasConfig({
        wasConfigJson: JSON.stringify({ dest: "out", files: "icons/*.svg" }),
        workspaceRoot: repoRoot,
      }),
    ).rejects.toThrow(/"name" must be a non-empty string/u);
  });
});
