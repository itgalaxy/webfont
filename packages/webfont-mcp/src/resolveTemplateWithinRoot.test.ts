import { join } from "node:path";
import { getWorkspaceRoot, PathSandboxError } from "./pathSandbox.js";
import { isBuiltInTemplateName, resolveTemplateWithinRoot } from "./resolveTemplateWithinRoot.js";

const repoRoot = getWorkspaceRoot(join(import.meta.dirname, "../../.."));

describe("resolveTemplateWithinRoot", () => {
  it("should leave built-in template names unchanged", () => {
    expect(resolveTemplateWithinRoot("css", repoRoot)).toBe("css");
    expect(resolveTemplateWithinRoot(" scss ", repoRoot)).toBe("scss");
    expect(isBuiltInTemplateName("html")).toBe(true);
  });

  it("should resolve custom template paths within workspaceRoot", () => {
    const resolved = resolveTemplateWithinRoot("packages/webfont/src/fixtures/templates/template.css", repoRoot);
    expect(resolved.endsWith("packages/webfont/src/fixtures/templates/template.css")).toBe(true);
  });

  it("should not allow custom template paths outside workspaceRoot", () => {
    expect(() => resolveTemplateWithinRoot("/etc/passwd", repoRoot)).toThrow(PathSandboxError);
  });

  it("should reject an empty template string", () => {
    expect(() => resolveTemplateWithinRoot("   ", repoRoot)).toThrow(/non-empty string/u);
  });
});
