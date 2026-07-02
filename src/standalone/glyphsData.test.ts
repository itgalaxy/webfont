import fs from "fs";
import path from "path";
import type { GlyphData, WebfontOptions } from "../types";
import { getGlyphsData } from "./glyphsData";
import { getOptions } from "./options";

const fixturesDir = path.join(__dirname, "../fixtures/svg-icons");
const svgFiles = [
  path.join(fixturesDir, "avatar.svg"),
  path.join(fixturesDir, "envelope.svg"),
  path.join(fixturesDir, "phone-call.svg"),
];

const getTestOptions = (maxConcurrency: number, overrides: Partial<WebfontOptions> = {}): WebfontOptions => ({
  ...getOptions({
    files: "unused",
    ligatures: false,
    sort: false,
  }),
  maxConcurrency,
  ...overrides,
});

describe("glyphsData", () => {
  it("should load glyph contents and metadata for each svg file", async () => {
    const glyphsData = (await getGlyphsData(svgFiles, getTestOptions(2))) as GlyphData[];

    expect(glyphsData).toHaveLength(svgFiles.length);
    expect(glyphsData.map((glyph) => glyph.srcPath).sort()).toEqual([...svgFiles].sort());

    glyphsData.forEach((glyph) => {
      expect(glyph.contents).toContain("<svg");
      expect(glyph.metadata?.name).toBeTruthy();
      expect(glyph.metadata?.unicode.length).toBeGreaterThan(0);
    });
  });

  it("should respect maxConcurrency when reading svg files", async () => {
    const maxConcurrency = 2;
    let activeReads = 0;
    let maxObservedConcurrency = 0;
    const originalCreateReadStream = fs.createReadStream;

    const createReadStreamSpy = jest.spyOn(fs, "createReadStream").mockImplementation((...args) => {
      activeReads += 1;
      maxObservedConcurrency = Math.max(maxObservedConcurrency, activeReads);

      const stream = originalCreateReadStream.apply(fs, args);

      const release = (): void => {
        activeReads -= 1;
      };

      // P-limit frees a slot when the read promise resolves on "end", not on "close".
      stream.once("end", release);
      stream.once("error", release);

      return stream;
    });

    try {
      const glyphsData = (await getGlyphsData(svgFiles, getTestOptions(maxConcurrency))) as GlyphData[];

      expect(glyphsData).toHaveLength(svgFiles.length);
      expect(maxObservedConcurrency).toBeLessThanOrEqual(maxConcurrency);
      expect(maxObservedConcurrency).toBeGreaterThan(1);
    } finally {
      createReadStreamSpy.mockRestore();
    }
  });

  it("should process svg files sequentially when maxConcurrency is 1", async () => {
    let activeReads = 0;
    let maxObservedConcurrency = 0;
    const originalCreateReadStream = fs.createReadStream;

    const createReadStreamSpy = jest.spyOn(fs, "createReadStream").mockImplementation((...args) => {
      activeReads += 1;
      maxObservedConcurrency = Math.max(maxObservedConcurrency, activeReads);

      const stream = originalCreateReadStream.apply(fs, args);

      const release = (): void => {
        activeReads -= 1;
      };

      stream.once("end", release);
      stream.once("error", release);

      return stream;
    });

    try {
      const glyphsData = (await getGlyphsData(svgFiles, getTestOptions(1))) as GlyphData[];

      expect(glyphsData).toHaveLength(svgFiles.length);
      expect(maxObservedConcurrency).toBe(1);
    } finally {
      createReadStreamSpy.mockRestore();
    }
  });

  it("should sort glyphs when sort is enabled", async () => {
    const glyphsData = (await getGlyphsData(svgFiles, getTestOptions(2, { sort: true }))) as GlyphData[];

    expect(glyphsData.map((glyph) => path.basename(glyph.srcPath))).toEqual([
      "avatar.svg",
      "envelope.svg",
      "phone-call.svg",
    ]);
  });

  it("should add ligature unicode when ligatures is enabled", async () => {
    const glyphsData = (await getGlyphsData(
      svgFiles.slice(0, 1),
      getTestOptions(1, { ligatures: true }),
    )) as GlyphData[];

    expect(glyphsData[0].metadata?.unicode?.length).toBeGreaterThan(1);
    expect(glyphsData[0].metadata?.unicode).toContain("avatar");
  });

  it("should normalize string unicode values from metadata provider", async () => {
    const glyphsData = (await getGlyphsData(svgFiles.slice(0, 1), {
      ...getTestOptions(1),
      metadataProvider: (_srcPath, callback) => {
        callback(null, { name: "custom-glyph", unicode: "\u0001" });
      },
    })) as GlyphData[];

    expect(glyphsData[0].metadata?.unicode).toEqual(["\u0001"]);
  });

  it("should normalize metadata without unicode values", async () => {
    const glyphsData = (await getGlyphsData(svgFiles.slice(0, 1), {
      ...getTestOptions(1),
      metadataProvider: (_srcPath, callback) => {
        callback(null, { name: "no-unicode-glyph" });
      },
    })) as GlyphData[];

    expect(glyphsData[0].metadata?.unicode).toEqual([]);
  });

  it("should reject when metadata provider returns no metadata", async () => {
    await expect(
      getGlyphsData(svgFiles.slice(0, 1), {
        ...getTestOptions(1),
        metadataProvider: (_srcPath, callback) => {
          callback(null, undefined);
        },
      }),
    ).rejects.toThrow(`Missing metadata for ${svgFiles[0]}`);
  });

  it("should reject when metadata provider returns an error", async () => {
    await expect(
      getGlyphsData(svgFiles.slice(0, 1), {
        ...getTestOptions(1),
        metadataProvider: (_srcPath, callback) => {
          callback(new Error("metadata failed"), undefined);
        },
      }),
    ).rejects.toThrow("metadata failed");
  });

  it("should reject when svg file read fails", async () => {
    const originalCreateReadStream = fs.createReadStream;

    const createReadStreamSpy = jest.spyOn(fs, "createReadStream").mockImplementation((...args) => {
      const stream = originalCreateReadStream.apply(fs, args);
      stream.emit("error", new Error("read failed"));
      return stream;
    });

    try {
      await expect(getGlyphsData(svgFiles.slice(0, 1), getTestOptions(1))).rejects.toThrow("read failed");
    } finally {
      createReadStreamSpy.mockRestore();
    }
  });

  it("should reject empty svg files", async () => {
    const emptyFile = path.join(__dirname, "../fixtures/bad-svg-icons/avatar-3.svg");

    await expect(getGlyphsData([emptyFile], getTestOptions(1))).rejects.toThrow(/Empty file/u);
  });
});
