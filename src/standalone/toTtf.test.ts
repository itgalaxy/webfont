vi.mock("svg2ttf", () => ({
  default: vi.fn(() => ({ buffer: new Uint8Array([0x74, 0x74, 0x66]) })),
}));

import svg2ttf from "svg2ttf";
import toTtf from "./toTtf";

const mockedSvg2ttf = vi.mocked(svg2ttf);

const sampleSvgFont = '<font><font-face font-family="icons"/></font>';
const sampleTtfBytes = new Uint8Array([0x74, 0x74, 0x66]);

describe("toTtf", () => {
  beforeEach(() => {
    mockedSvg2ttf.mockClear();
    mockedSvg2ttf.mockReturnValue({ buffer: sampleTtfBytes });
  });

  it("should call svg2ttf with the svg font string and default options", () => {
    const result = toTtf(sampleSvgFont);

    expect(mockedSvg2ttf).toHaveBeenCalledTimes(1);
    expect(mockedSvg2ttf).toHaveBeenCalledWith(sampleSvgFont, {});
    expect(result).toEqual(Buffer.from(sampleTtfBytes));
  });

  it("should return a Buffer copy of the svg2ttf micro buffer", () => {
    const returnedBuffer = new Uint8Array([1, 2, 3]);
    mockedSvg2ttf.mockReturnValueOnce({ buffer: returnedBuffer });

    const result = toTtf(sampleSvgFont);

    expect(result).toEqual(Buffer.from(returnedBuffer));
    expect(result).not.toBe(returnedBuffer);
  });

  describe("formatsOptions.ttf forwarding", () => {
    it.each([
      ["copyright", { copyright: "© Example Corp" }],
      ["description", { description: "Icon font" }],
      ["ts", { ts: 1457357570 }],
      ["url", { url: "https://example.com/fonts" }],
      ["version", { version: "Version 2.0" }],
    ] as const)("should forward %s to svg2ttf", (_name, option) => {
      toTtf(sampleSvgFont, option);

      expect(mockedSvg2ttf).toHaveBeenCalledWith(sampleSvgFont, option);
    });

    it("should forward every formatsOptions.ttf field to svg2ttf together", () => {
      const ttfOptions = {
        copyright: "© Example Corp",
        description: "Icon font",
        ts: 1457357570,
        url: "https://example.com/fonts",
        version: "Version 2.0",
      };

      toTtf(sampleSvgFont, ttfOptions);

      expect(mockedSvg2ttf).toHaveBeenCalledWith(sampleSvgFont, ttfOptions);
    });
  });

  it("should propagate svg2ttf conversion errors", () => {
    mockedSvg2ttf.mockImplementation(() => {
      throw new Error("svg2ttf failed");
    });

    expect(() => toTtf(sampleSvgFont)).toThrow("svg2ttf failed");
  });
});
