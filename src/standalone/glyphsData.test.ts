import fs from "fs";
import path from "path";
import type { GlyphData } from "../types";
import { getGlyphsData } from "./glyphsData";
import { getOptions } from "./options";

const fixturesDir = path.join(__dirname, "../fixtures/svg-icons");
const svgFiles = [
  path.join(fixturesDir, "avatar.svg"),
  path.join(fixturesDir, "envelope.svg"),
  path.join(fixturesDir, "phone-call.svg"),
];

const getTestOptions = (maxConcurrency: number) => ({
  ...getOptions({
    files: "unused",
    ligatures: false,
    sort: false,
  }),
  maxConcurrency,
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
});
