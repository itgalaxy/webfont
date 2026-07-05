import { buildSvgToolsFromCliFlags } from "./buildSvgToolsFromCliFlags";

describe("buildSvgToolsFromCliFlags", () => {
  it("should build diagnose-only svgTools", () => {
    expect(buildSvgToolsFromCliFlags({ svgDiagnose: true })).toEqual({ diagnose: true });
  });

  it("should return undefined when no svg tool flags are set", () => {
    expect(buildSvgToolsFromCliFlags({})).toBeUndefined();
  });
});
