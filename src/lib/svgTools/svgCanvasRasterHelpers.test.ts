import { parsePolylinePoints, parseViewBoxRect, resolveSvgPaintColor } from "./svgCanvasRasterHelpers";

describe("svgCanvasRasterHelpers", () => {
  it("should parse viewBox rectangles", () => {
    expect(parseViewBoxRect("0 0 24 24")).toEqual({
      minX: 0,
      minY: 0,
      width: 24,
      height: 24,
    });
  });

  it("should map currentColor to black and none to null", () => {
    expect(resolveSvgPaintColor("currentColor")).toBe("#000000");
    expect(resolveSvgPaintColor("none")).toBeNull();
    expect(resolveSvgPaintColor("#ff0000")).toBe("#ff0000");
  });

  it("should parse polyline point lists", () => {
    expect(parsePolylinePoints("1.25,3.25 3.25,20.75 20.75,20.75")).toEqual([
      [1.25, 3.25],
      [3.25, 20.75],
      [20.75, 20.75],
    ]);
  });
});
