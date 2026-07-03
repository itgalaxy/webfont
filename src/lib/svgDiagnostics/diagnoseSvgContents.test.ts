import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hasEvenoddFillRule } from "../evenoddFillRule";
import { diagnoseSvgContents, hasStrokeOnlySvg, hasUnsupportedSvgElements } from "./diagnoseSvgContents";

const fixturesGlob = resolve(__dirname, "../../fixtures");

describe("diagnoseSvgContents", () => {
  it("should detect evenodd fill-rule (#175)", () => {
    const svg = readFileSync(`${fixturesGlob}/svg-evenodd/linkedin.svg`, "utf8");

    expect(hasEvenoddFillRule(svg)).toBe(true);

    const diagnostics = diagnoseSvgContents("linkedin.svg", svg);

    expect(diagnostics.some((entry) => entry.code === "evenodd-fill-rule")).toBe(true);
  });

  it("should detect stroke-only Lucide-style SVGs", () => {
    const svg = readFileSync(`${fixturesGlob}/svg-stroke-icons/stroked-plus.svg`, "utf8");

    expect(hasStrokeOnlySvg(svg)).toBe(true);

    const diagnostics = diagnoseSvgContents("stroked-plus.svg", svg);

    expect(diagnostics.some((entry) => entry.code === "stroke-only")).toBe(true);
    expect(diagnostics.some((entry) => entry.code === "unsupported-element")).toBe(true);
  });

  it("should not flag filled SVGs without stroke-only patterns", () => {
    const svg = readFileSync(`${fixturesGlob}/svg-stroke-icons/plus-filled.svg`, "utf8");

    expect(hasStrokeOnlySvg(svg)).toBe(false);
    expect(hasUnsupportedSvgElements(svg)).toBe(false);
    expect(diagnoseSvgContents("plus-filled.svg", svg)).toEqual([]);
  });
});
