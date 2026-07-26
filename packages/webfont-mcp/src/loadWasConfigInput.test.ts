import { join } from "node:path";
import { loadWasConfigsFromInput } from "./loadWasConfigInput.js";
import { getWorkspaceRoot, PathSandboxError } from "./pathSandbox.js";

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

  it("should reject an empty wasConfigPath with a clear field error instead of falling through to JSON parse", async () => {
    await expect(
      loadWasConfigsFromInput({
        wasConfigPath: "",
        workspaceRoot: repoRoot,
      }),
    ).rejects.toThrow(/wasConfigPath must be a non-empty string/u);
  });

  it("should reject an empty wasConfigJson with a clear field error", async () => {
    await expect(
      loadWasConfigsFromInput({
        wasConfigJson: "   ",
        workspaceRoot: repoRoot,
      }),
    ).rejects.toThrow(/wasConfigJson must be a non-empty string/u);
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
    expect(loaded.configs[0]?.template).toBe("css");
  });

  it("should sandbox custom .was template paths and reject paths outside workspaceRoot", async () => {
    const inside = await loadWasConfigsFromInput({
      wasConfigJson: JSON.stringify({
        dest: "packages/webfont-mcp/.tmp/was-validate-dest",
        files: "packages/webfont/src/fixtures/svg-icons/*.svg",
        name: "FixtureFont",
        prefix: "fixture-icon",
        formats: ["woff2"],
        template: "packages/webfont/src/fixtures/templates/template.css",
      }),
      workspaceRoot: repoRoot,
    });

    expect(inside.configs[0]?.template).toContain("packages/webfont/src/fixtures/templates/template.css");

    await expect(
      loadWasConfigsFromInput({
        wasConfigJson: JSON.stringify({
          dest: "packages/webfont-mcp/.tmp/was-validate-dest",
          files: "packages/webfont/src/fixtures/svg-icons/*.svg",
          name: "FixtureFont",
          prefix: "fixture-icon",
          formats: ["woff2"],
          template: "/etc/passwd",
        }),
        workspaceRoot: repoRoot,
      }),
    ).rejects.toThrow(PathSandboxError);
  });
});
