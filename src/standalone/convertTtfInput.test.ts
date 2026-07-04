import * as fsPromise from "fs/promises";
import isSvg from "is-svg";
import isTtf from "is-ttf";
import isWoff2 from "is-woff2";
import { vi } from "vitest";
import { encodeTtfToWoff2 } from "../lib/ttfEncode";
import type { WebfontOptions } from "../types/WebfontOptions";
import { convertTtfInput } from "./convertTtfInput";

const fixtureTtf = "src/fixtures/fonts/iconfont.ttf";

describe("convertTtfInput", () => {
  it("should reject template option", async () => {
    await expect(
      convertTtfInput([fixtureTtf], {
        files: fixtureTtf,
        formats: ["woff2"],
        template: "css",
      } as WebfontOptions),
    ).rejects.toThrow("Templates are not supported when converting TTF input");
  });

  it("should reject glyphTransformFn option", async () => {
    await expect(
      convertTtfInput([fixtureTtf], {
        files: fixtureTtf,
        formats: ["woff2"],
        glyphTransformFn: async () => ({ name: "x", unicode: [] }),
      } as unknown as WebfontOptions),
    ).rejects.toThrow("glyphTransformFn is not supported when converting TTF input");
  });

  it("should reject glyphContentTransformFn option", async () => {
    await expect(
      convertTtfInput([fixtureTtf], {
        files: fixtureTtf,
        formats: ["woff2"],
        glyphContentTransformFn: async () => "<svg></svg>",
      } as unknown as WebfontOptions),
    ).rejects.toThrow("glyphContentTransformFn is not supported when converting TTF input");
  });

  it("should reject empty font file list", async () => {
    await expect(
      convertTtfInput([], {
        files: fixtureTtf,
        formats: ["woff2"],
      } as WebfontOptions),
    ).rejects.toThrow("No TTF files matched");
  });

  it("should reject invalid ttf bytes", async () => {
    const invalidPath = "temp/invalid.ttf";

    await fsPromise.mkdir("temp", { recursive: true });
    await fsPromise.writeFile(invalidPath, "not a font");

    try {
      await expect(
        convertTtfInput([invalidPath], {
          files: invalidPath,
          formats: ["woff2"],
        } as WebfontOptions),
      ).rejects.toThrow(`Input is not a valid TrueType font: ${invalidPath}`);
    } finally {
      await fsPromise.rm(invalidPath, { force: true });
    }
  });

  it("should reject remote ttf URLs with a clear error", async () => {
    const remoteUrl = "https://cdn.example.com/fonts/iconfont.ttf";

    await expect(
      convertTtfInput([remoteUrl], {
        files: remoteUrl,
        formats: ["woff2"],
      } as WebfontOptions),
    ).rejects.toThrow(`Remote TTF URLs are not supported. Download the file first: ${remoteUrl}`);
  });

  it("should log verbose progress when encoding", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(vi.fn());

    try {
      await convertTtfInput([fixtureTtf], {
        files: fixtureTtf,
        formats: ["woff2"],
        verbose: true,
      } as WebfontOptions);

      expect(logSpy).toHaveBeenCalledWith(`Encoding ${fixtureTtf}...`);
    } finally {
      logSpy.mockRestore();
    }
  });

  it("should mirror single-input outputs on result top level", async () => {
    const result = await convertTtfInput([fixtureTtf], {
      files: fixtureTtf,
      formats: ["ttf", "woff2"],
    } as WebfontOptions);

    expect(isTtf(result.ttf)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.transcodedFonts).toHaveLength(1);
  });

  it("should encode ttf input to a valid svg font when requested", async () => {
    const result = await convertTtfInput([fixtureTtf], {
      files: fixtureTtf,
      formats: ["svg"],
    } as WebfontOptions);

    expect(typeof result.svg).toBe("string");
    expect(isSvg(result.svg as string)).toBe(true);
    expect(result.transcodedFonts?.[0]?.svg).toBe(result.svg);
  });

  it("should not emit svg unless it is requested", async () => {
    const result = await convertTtfInput([fixtureTtf], {
      files: fixtureTtf,
      formats: ["woff2"],
    } as WebfontOptions);

    expect(result.svg).toBeUndefined();
    expect(result.transcodedFonts?.[0]?.svg).toBeUndefined();
  });

  it("should encode svg for every input in a batch run", async () => {
    const result = await convertTtfInput([fixtureTtf, fixtureTtf], {
      files: [fixtureTtf, fixtureTtf],
      formats: ["svg"],
    } as WebfontOptions);

    expect(result.svg).toBeUndefined();
    expect(result.transcodedFonts).toHaveLength(2);
    expect(result.transcodedFonts?.every((font) => isSvg(font.svg as string))).toBe(true);
  });

  it("should not mirror top-level outputs for batch runs", async () => {
    const result = await convertTtfInput([fixtureTtf, fixtureTtf], {
      files: [fixtureTtf, fixtureTtf],
      formats: ["woff2"],
    } as WebfontOptions);

    expect(result.woff2).toBeUndefined();
    expect(result.transcodedFonts).toHaveLength(2);
  });

  it("should document shared ttf encoder output", async () => {
    const ttf = await fsPromise.readFile(fixtureTtf);
    const encoded = await encodeTtfToWoff2(ttf);

    expect(isWoff2(encoded)).toBe(true);
  });
});
