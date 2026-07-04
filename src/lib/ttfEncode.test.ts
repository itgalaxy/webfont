import crypto from "crypto";
import fontverter from "fontverter";
import * as fsPromise from "fs/promises";
import isEot from "is-eot";
import isSvg from "is-svg";
import isTtf from "is-ttf";
import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import wawoff2 from "wawoff2";
import { encodeTtfToEot, encodeTtfToSvg, encodeTtfToWoff, encodeTtfToWoff2 } from "./ttfEncode";

const fixtureTtf = "src/fixtures/fonts/iconfont.ttf";

describe("ttfEncode", () => {
  describe("encodeTtfToWoff2 (wawoff2.compress)", () => {
    it("should compress a ttf buffer to a valid woff2 buffer", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const woff2 = await encodeTtfToWoff2(ttf);

      expect(isWoff2(woff2)).toBe(true);
      expect(woff2.length).toBeGreaterThan(0);
    });

    it("should produce deterministic woff2 output for fixture icons", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const woff2 = await encodeTtfToWoff2(ttf);
      const hash = crypto.createHash("md5").update(woff2).digest("hex");

      expect(hash).toBe("2ad812a7b330c471a908eba3df6de6a2");
    });

    it("should round-trip through wawoff2.decompress to valid ttf", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const woff2 = await encodeTtfToWoff2(ttf);
      const roundTrip = Buffer.from(await wawoff2.decompress(woff2));

      expect(isTtf(roundTrip)).toBe(true);
    });

    it("should round-trip through fontverter (webfont WOFF2 decompress path)", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const woff2 = await encodeTtfToWoff2(ttf);
      const sfnt = Buffer.from(await fontverter.convert(woff2, "sfnt"));

      expect(isTtf(sfnt)).toBe(true);
    });
  });

  describe("encodeTtfToWoff (ttf2woff)", () => {
    it("should encode a ttf buffer to a valid woff buffer", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const woff = encodeTtfToWoff(ttf);

      expect(isWoff(woff)).toBe(true);
    });
  });

  describe("encodeTtfToEot (ttf2eot adapter)", () => {
    it("should encode a ttf buffer to a valid eot buffer", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const eot = encodeTtfToEot(ttf);

      expect(isEot(eot)).toBe(true);
    });
  });

  describe("encodeTtfToSvg (fonteditor-core)", () => {
    it("should encode a ttf buffer to a valid svg font string", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const svg = encodeTtfToSvg(ttf);

      expect(typeof svg).toBe("string");
      expect(isSvg(svg)).toBe(true);
      expect(svg).toContain("<font");
      expect(svg).toContain("<font-face");
      expect(svg).toContain("<glyph");
    });

    it("should embed provided metadata in the svg output", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const svg = encodeTtfToSvg(ttf, { metadata: "webfont-metadata-marker" });

      expect(svg).toContain("<metadata>webfont-metadata-marker</metadata>");
    });

    it("should not embed metadata when none is provided", async () => {
      const ttf = await fsPromise.readFile(fixtureTtf);
      const svg = encodeTtfToSvg(ttf);

      expect(svg).toContain("<metadata></metadata>");
    });
  });
});
