import type { WebfontOptions } from "../../types";
import { getFontStreamOptions, normalizeRoundOption } from "./index";

describe("svgicons2svgfont helpers", () => {
  describe("normalizeRoundOption", () => {
    it("should return numbers unchanged", () => {
      expect(normalizeRoundOption(4)).toBe(4);
    });

    it("should parse numeric strings from the CLI (#569)", () => {
      expect(normalizeRoundOption("4")).toBe(4);
    });

    it("should return undefined for non-numeric strings", () => {
      expect(normalizeRoundOption("not-a-number")).toBeUndefined();
    });

    it("should return undefined for empty strings", () => {
      expect(normalizeRoundOption("")).toBeUndefined();
    });

    it("should return undefined for whitespace-only strings", () => {
      expect(normalizeRoundOption("   ")).toBeUndefined();
    });

    it("should return undefined for non-finite numbers", () => {
      expect(normalizeRoundOption(Number.POSITIVE_INFINITY)).toBeUndefined();
      expect(normalizeRoundOption(Number.NaN)).toBeUndefined();
    });

    it("should return undefined for non-finite numeric strings", () => {
      expect(normalizeRoundOption("Infinity")).toBeUndefined();
    });

    it("should return undefined for null", () => {
      expect(normalizeRoundOption(null)).toBeUndefined();
    });
  });

  describe("getFontStreamOptions", () => {
    it("should pass coerced round to the font stream", () => {
      const options = {
        round: "4",
      } as WebfontOptions;

      expect(getFontStreamOptions(options).round).toBe(4);
    });
  });
});
