import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { convertSvgsToFont, resetConversionDest } from "./convertSvgsToFont.js";
import { getWorkspaceRoot } from "./pathSandbox.js";

const repoRoot = getWorkspaceRoot(join(import.meta.dirname, "../../.."));
const fixtureGlob = "packages/webfont/src/fixtures/svg-icons/*.svg";
const tempBase = join(repoRoot, "packages/webfont-mcp/.tmp");

describe("convertSvgsToFont", () => {
  let outputDir = "";

  afterEach(async () => {
    if (outputDir) {
      await resetConversionDest(outputDir);
      outputDir = "";
    }
  });

  it("should write woff2 output for fixture SVGs within the workspace sandbox", async () => {
    await mkdir(tempBase, { recursive: true });
    outputDir = await mkdtemp(join(tempBase, "convert-"));

    const result = await convertSvgsToFont({
      dest: outputDir,
      destCreate: true,
      files: [fixtureGlob],
      fontName: "fixture-icons",
      formats: ["woff2"],
      workspaceRoot: repoRoot,
    });

    expect(result.glyphCount).toBeGreaterThan(0);
    expect(result.writtenFiles.some((file) => file.endsWith(".woff2"))).toBe(true);
  });
});
