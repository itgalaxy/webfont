import { join } from "node:path";
import { getWorkspaceRoot, PathSandboxError, resolvePathWithinRoot } from "./pathSandbox.js";

const repoRoot = getWorkspaceRoot(join(import.meta.dirname, "../../.."));

describe("pathSandbox", () => {
  it("should resolve relative paths within workspaceRoot", () => {
    const resolved = resolvePathWithinRoot("packages/webfont/README.md", repoRoot);
    expect(resolved.endsWith("packages/webfont/README.md")).toBe(true);
  });

  it("should not allow paths outside workspaceRoot", () => {
    expect(() => resolvePathWithinRoot("/etc/passwd", repoRoot)).toThrow(PathSandboxError);
  });
});
