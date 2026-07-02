import * as fs from "fs";
import isTtf from "is-ttf";
import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import standalone from "../standalone";

const fixtureWoff = "src/fixtures/fonts/iconfont.woff";
const fixtureWoff2 = "src/fixtures/fonts/iconfont.woff2";

describe("webfont WOFF/WOFF2 conversion", () => {
  it("should convert woff2 input to ttf output", async () => {
    const result = await standalone({
      files: fixtureWoff2,
      formats: ["ttf"],
    });

    expect(result.ttf).toBeDefined();
    expect(isTtf(result.ttf)).toBe(true);
    expect(result.woff2).toBeUndefined();
    expect(result.svg).toBeUndefined();
    expect(result.glyphsData).toBeUndefined();
  });

  it("should convert woff input to ttf output", async () => {
    const result = await standalone({
      files: fixtureWoff,
      formats: ["ttf"],
    });

    expect(result.ttf).toBeDefined();
    expect(isTtf(result.ttf)).toBe(true);
  });

  it("should default to ttf output when svg pipeline formats are still configured", async () => {
    const result = await standalone({
      files: fixtureWoff2,
    });

    expect(result.ttf).toBeDefined();
    expect(isTtf(result.ttf)).toBe(true);
    expect(result.woff).toBeUndefined();
    expect(result.woff2).toBeUndefined();
  });

  it("should produce a valid ttf when round-tripping woff2 input", async () => {
    const converted = await standalone({ files: fixtureWoff2, formats: ["ttf"] });

    expect(isTtf(converted.ttf)).toBe(true);
    expect(converted.hash).toBeUndefined();
  });

  it("should produce a valid ttf when round-tripping woff input", async () => {
    const converted = await standalone({ files: fixtureWoff, formats: ["ttf"] });

    expect(isTtf(converted.ttf)).toBe(true);
    expect(converted.hash).toBeUndefined();
  });

  it("should reject mixed svg and webfont inputs", async () => {
    await expect(
      standalone({
        files: ["src/fixtures/svg-icons/avatar.svg", fixtureWoff2],
        formats: ["ttf"],
      }),
    ).rejects.toThrow("Cannot mix SVG icons with WOFF/WOFF2 font files");
  });

  it("should reject unsupported input extensions", async () => {
    await expect(
      standalone({
        files: "package.json",
        formats: ["ttf"],
      }),
    ).rejects.toThrow("did not match any supported files");
  });

  it("should reject extension-less files mixed with webfont inputs", async () => {
    await expect(
      standalone({
        files: ["LICENSE", fixtureWoff2],
        formats: ["ttf"],
      }),
    ).rejects.toThrow("did not match any supported files");
  });

  it("should reject multiple webfont files in one run", async () => {
    await expect(
      standalone({
        files: [fixtureWoff, fixtureWoff2],
        formats: ["ttf"],
      }),
    ).rejects.toThrow("WOFF/WOFF2 conversion supports one font file at a time");
  });

  it("should attach discovered config filePath when converting woff2 input", async () => {
    const result = await standalone({
      configFile: "src/fixtures/configs/.webfontrc-conversion.json",
      files: fixtureWoff2,
      formats: ["ttf"],
    });

    expect(result.config?.filePath).toContain(".webfontrc-conversion.json");
    expect(result.config?.fontName).toBe("conversion-config-font");
    expect(result.ttf).toBeDefined();
  });

  it("should reject requesting both ttf and otf when the sfnt flavor is TrueType only", async () => {
    await expect(
      standalone({
        files: fixtureWoff2,
        formats: ["ttf", "otf"],
      }),
    ).rejects.toThrow('Input decompresses to TrueType (TTF). Request "ttf" format instead of "otf".');
  });

  it("should document that input fixtures are valid webfont containers", () => {
    const woff = fs.readFileSync(fixtureWoff);
    const woff2 = fs.readFileSync(fixtureWoff2);

    expect(isWoff(woff)).toBe(true);
    expect(isWoff2(woff2)).toBe(true);
  });
});
