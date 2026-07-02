import { evenoddFillRuleWarning, hasEvenoddFillRule } from "./evenoddFillRule";

describe("evenoddFillRule", () => {
  it("should detect evenodd in inline style (#175)", () => {
    expect(hasEvenoddFillRule('style="fill-rule:evenodd;clip-rule:evenodd"')).toBe(true);
  });

  it("should detect evenodd as a path attribute", () => {
    expect(hasEvenoddFillRule('<path fill-rule="evenodd" d="M0 0"/>')).toBe(true);
  });

  it("should not flag nonzero fill rules", () => {
    expect(hasEvenoddFillRule('style="fill-rule:nonzero"')).toBe(false);
  });

  it("should include troubleshooting guidance in the warning", () => {
    expect(evenoddFillRuleWarning("icons/linkedin.svg")).toContain("fill-rule: evenodd");
    expect(evenoddFillRuleWarning("icons/linkedin.svg")).toContain("TROUBLESHOOTING.md");
  });
});
