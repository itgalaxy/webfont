import { buildOutlinedSvg, computeRasterSize, parseSvgLayout } from "./outlineStrokeWasmLayout";

describe("outlineStrokeWasmLayout", () => {
  it("should parse viewBox dimensions from SVG contents", () => {
    expect(parseSvgLayout('<svg viewBox="0 0 24 24" fill="none"><path d="M0 0"/></svg>')).toEqual({
      viewBox: "0 0 24 24",
      width: 24,
      height: 24,
    });
  });

  it("should fall back to width and height attributes when viewBox is missing", () => {
    expect(parseSvgLayout('<svg width="32" height="16"><rect width="32" height="16"/></svg>')).toEqual({
      viewBox: "0 0 32 16",
      width: 32,
      height: 16,
    });
  });

  it("should scale raster dimensions with a minimum size", () => {
    expect(computeRasterSize(24, 24, 8)).toEqual({ width: 192, height: 192 });
    expect(computeRasterSize(4, 4, 8)).toEqual({ width: 64, height: 64 });
  });

  it("should build outlined SVG with preserved viewBox", () => {
    expect(buildOutlinedSvg("0 0 24 24", '<path fill="#000000" d="M0 0"/>')).toContain('viewBox="0 0 24 24"');
  });
});
