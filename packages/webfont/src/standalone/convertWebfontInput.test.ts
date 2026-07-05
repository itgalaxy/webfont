vi.mock("fontverter", () => ({
  default: {
    convert: vi.fn(),
  },
}));

import fontverter from "fontverter";
import * as fsPromise from "fs/promises";
import isTtf from "is-ttf";
import { getSfntFlavor } from "../lib/sfnt/flavor";
import type { WebfontOptions } from "../types/WebfontOptions";
import { convertWebfontInput } from "./convertWebfontInput";
import { getOptions } from "./options";

const mockedConvert = vi.mocked(fontverter.convert);

const fixtureTtf = "src/fixtures/fonts/iconfont.ttf";
const fixtureWoff = "src/fixtures/fonts/iconfont.woff";
const fixtureWoff2 = "src/fixtures/fonts/iconfont.woff2";

const getConversionOptions = (overrides: Partial<WebfontOptions> = {}): WebfontOptions => ({
  ...getOptions({ files: fixtureWoff2, formats: ["ttf"] }),
  ...overrides,
});

describe("convertWebfontInput", () => {
  beforeEach(() => {
    mockedConvert.mockReset();
  });

  it("should decompress woff2 input to ttf output", async () => {
    const sfnt = await fsPromise.readFile(fixtureTtf);
    mockedConvert.mockResolvedValue(sfnt);

    const result = await convertWebfontInput([fixtureWoff2], getConversionOptions());

    expect(mockedConvert).toHaveBeenCalledWith(expect.any(Buffer), "sfnt");
    expect(result.ttf).toBeDefined();
    expect(isTtf(result.ttf)).toBe(true);
    expect(result.otf).toBeUndefined();
  });

  it("should decompress woff input to ttf output", async () => {
    const sfnt = await fsPromise.readFile(fixtureTtf);
    mockedConvert.mockResolvedValue(sfnt);

    const result = await convertWebfontInput([fixtureWoff], getConversionOptions());

    expect(result.ttf).toEqual(sfnt);
  });

  it("should emit otf output when the sfnt flavor is OpenType", async () => {
    const otto = Buffer.alloc(8);
    otto.writeUInt32BE(0x4f_54_54_4f, 0);
    mockedConvert.mockResolvedValue(otto);

    const result = await convertWebfontInput([fixtureWoff2], getConversionOptions({ formats: ["otf"] }));

    expect(getSfntFlavor(otto)).toBe("otf");
    expect(result.otf).toEqual(otto);
    expect(result.ttf).toBeUndefined();
  });

  it("should reject ttf output when the sfnt flavor is OpenType", async () => {
    const otto = Buffer.alloc(8);
    otto.writeUInt32BE(0x4f_54_54_4f, 0);
    mockedConvert.mockResolvedValue(otto);

    await expect(convertWebfontInput([fixtureWoff2], getConversionOptions({ formats: ["ttf"] }))).rejects.toThrow(
      'Input decompresses to OpenType (OTF). Request "otf" format instead of "ttf" for src/fixtures/fonts/iconfont.woff2.',
    );
  });

  it("should reject otf output when the sfnt flavor is TrueType", async () => {
    const sfnt = await fsPromise.readFile(fixtureTtf);
    mockedConvert.mockResolvedValue(sfnt);

    await expect(convertWebfontInput([fixtureWoff2], getConversionOptions({ formats: ["otf"] }))).rejects.toThrow(
      'Input decompresses to TrueType (TTF). Request "ttf" format instead of "otf" for src/fixtures/fonts/iconfont.woff2.',
    );
  });

  it("should reject empty font file lists", async () => {
    await expect(convertWebfontInput([], getConversionOptions())).rejects.toThrow(
      "No WOFF or WOFF2 files matched",
    );
  });

  it("should decompress multiple webfont files in one conversion run", async () => {
    const sfnt = await fsPromise.readFile(fixtureTtf);
    mockedConvert.mockResolvedValue(sfnt);

    const result = await convertWebfontInput([fixtureWoff, fixtureWoff2], getConversionOptions());

    expect(result.decompressedFonts).toHaveLength(2);
    expect(result.decompressedFonts?.[0].source).toBe(fixtureWoff);
    expect(result.decompressedFonts?.[1].source).toBe(fixtureWoff2);
    expect(result.decompressedFonts?.[0].ttf).toBeDefined();
    expect(result.decompressedFonts?.[1].ttf).toBeDefined();
    expect(result.ttf).toBeUndefined();
    expect(result.otf).toBeUndefined();
  });

  it("should keep single-file ttf and otf on the result root for backward compatibility", async () => {
    const sfnt = await fsPromise.readFile(fixtureTtf);
    mockedConvert.mockResolvedValue(sfnt);

    const result = await convertWebfontInput([fixtureWoff2], getConversionOptions());

    expect(result.decompressedFonts).toHaveLength(1);
    expect(result.ttf).toEqual(sfnt);
  });

  it("should reject template rendering for webfont conversion", async () => {
    await expect(convertWebfontInput([fixtureWoff2], getConversionOptions({ template: "css" }))).rejects.toThrow(
      "Templates are not supported when converting WOFF/WOFF2 input",
    );
  });

  it("should reject glyphTransformFn for webfont conversion", async () => {
    await expect(
      convertWebfontInput(
        [fixtureWoff2],
        getConversionOptions({
          glyphTransformFn: async (metadata) => metadata,
        }),
      ),
    ).rejects.toThrow("glyphTransformFn is not supported when converting WOFF/WOFF2 input");
  });

  it("should reject glyphContentTransformFn for webfont conversion", async () => {
    await expect(
      convertWebfontInput(
        [fixtureWoff2],
        getConversionOptions({
          glyphContentTransformFn: async () => "<svg></svg>",
        }),
      ),
    ).rejects.toThrow("glyphContentTransformFn is not supported when converting WOFF/WOFF2 input");
  });

  it("should log verbose progress when verbose is enabled", async () => {
    const sfnt = await fsPromise.readFile(fixtureTtf);
    mockedConvert.mockResolvedValue(sfnt);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await convertWebfontInput([fixtureWoff2], getConversionOptions({ verbose: true }));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Decompressing"));
    } finally {
      logSpy.mockRestore();
    }
  });
});
