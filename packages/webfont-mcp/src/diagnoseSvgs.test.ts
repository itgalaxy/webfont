import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { diagnoseSvgs } from "./diagnoseSvgs.js";
import { getWorkspaceRoot } from "./pathSandbox.js";

const repoRoot = getWorkspaceRoot(join(import.meta.dirname, "../../.."));

describe("diagnoseSvgs", () => {
  it("should report stroke-only diagnostics for stroked SVG fixtures", async () => {
    const result = await diagnoseSvgs({
      files: ["packages/webfont/src/fixtures/svg-stroke-icons/stroked-plus.svg"],
      workspaceRoot: repoRoot,
    });

    expect(result.fileCount).toBe(1);
    expect(result.filesWithIssues).toBe(1);
    expect(result.diagnostics.some((entry) => entry.code === "stroke-only")).toBe(true);
  });

  it("should not report issues for filled fixture icons", async () => {
    const result = await diagnoseSvgs({
      files: ["packages/webfont/src/fixtures/svg-icons/envelope.svg"],
      workspaceRoot: repoRoot,
    });

    expect(result.fileCount).toBe(1);
    expect(result.diagnostics).toEqual([]);
  });
});
