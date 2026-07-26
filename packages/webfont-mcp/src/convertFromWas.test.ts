import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { convertFromWas } from "./convertFromWas.js";
import { resetConversionDest } from "./convertSvgsToFont.js";
import { getWorkspaceRoot } from "./pathSandbox.js";
import * as resolveSvgInputs from "./resolveSvgInputs.js";

const repoRoot = getWorkspaceRoot(join(import.meta.dirname, "../../.."));
const tempBase = join(repoRoot, "packages/webfont-mcp/.tmp");

describe("convertFromWas", () => {
  let outputDir = "";

  afterEach(async () => {
    if (outputDir) {
      await resetConversionDest(outputDir);
      outputDir = "";
    }
    vi.restoreAllMocks();
  });

  it("should convert fixture SVGs from an inline .was config and write woff2 output", async () => {
    await mkdir(tempBase, { recursive: true });
    outputDir = await mkdtemp(join(tempBase, "was-convert-"));
    const relativeDest = outputDir.slice(repoRoot.length + 1);

    const result = await convertFromWas({
      wasConfigJson: JSON.stringify({
        dest: relativeDest,
        files: "packages/webfont/src/fixtures/svg-icons/*.svg",
        name: "FixtureFont",
        prefix: "fixture-icon",
        formats: ["woff2"],
        template: "css",
      }),
      workspaceRoot: repoRoot,
    });

    expect(result.conversions).toHaveLength(1);
    expect(result.conversions[0]?.glyphCount).toBeGreaterThan(0);
    expect(result.conversions[0]?.writtenFiles.some((file) => file.endsWith(".woff2"))).toBe(true);
  });

  it("should resolve .was files globs through resolveSvgInputPaths before calling webfont", async () => {
    await mkdir(tempBase, { recursive: true });
    outputDir = await mkdtemp(join(tempBase, "was-resolve-"));
    const relativeDest = outputDir.slice(repoRoot.length + 1);
    const resolveSpy = vi.spyOn(resolveSvgInputs, "resolveSvgInputPaths");

    await convertFromWas({
      wasConfigJson: JSON.stringify({
        dest: relativeDest,
        files: "packages/webfont/src/fixtures/svg-icons/*.svg",
        name: "FixtureFont",
        prefix: "fixture-icon",
        formats: ["woff2"],
        template: "css",
      }),
      workspaceRoot: repoRoot,
    });

    expect(resolveSpy).toHaveBeenCalled();
    const resolved = await resolveSpy.mock.results[0]?.value;
    expect(Array.isArray(resolved)).toBe(true);
    expect(resolved.length).toBeGreaterThan(0);
    expect(resolved.every((file: string) => file.endsWith(".svg"))).toBe(true);
  });
});
