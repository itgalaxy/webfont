import * as fsPromise from "fs/promises";
import isEot from "is-eot";
import isSvg from "is-svg";
import isTtf from "is-ttf";
import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import standalone from "../standalone";

const fixtureTtf = "src/fixtures/fonts/iconfont.ttf";
const fixtureWoff2 = "src/fixtures/fonts/iconfont.woff2";

describe("TTF to webfont conversion", () => {
  it("should encode ttf input to woff and woff2 output", async () => {
    const result = await standalone({
      files: fixtureTtf,
      formats: ["woff", "woff2"],
    });

    expect(result.woff).toBeDefined();
    expect(result.woff2).toBeDefined();
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.svg).toBeUndefined();
    expect(result.glyphsData).toBeUndefined();
  });

  it("should default to woff and woff2 when svg pipeline formats are still configured", async () => {
    const result = await standalone({
      files: fixtureTtf,
    });

    expect(result.woff).toBeDefined();
    expect(result.woff2).toBeDefined();
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.ttf).toBeUndefined();
  });

  it("should pass through ttf and encode eot when requested", async () => {
    const result = await standalone({
      files: fixtureTtf,
      formats: ["ttf", "eot", "woff"],
    });

    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(result.woff2).toBeUndefined();
  });

  it("should reject mixed svg and ttf inputs", async () => {
    await expect(
      standalone({
        files: ["src/fixtures/svg-icons/avatar.svg", fixtureTtf],
        formats: ["woff2"],
      }),
    ).rejects.toThrow("Cannot mix SVG icons, TTF fonts, and WOFF/WOFF2 files");
  });

  it("should reject mixed ttf and webfont inputs", async () => {
    await expect(
      standalone({
        files: [fixtureTtf, fixtureWoff2],
        formats: ["woff2"],
      }),
    ).rejects.toThrow("Cannot mix SVG icons, TTF fonts, and WOFF/WOFF2 files");
  });

  it("should reject remote ttf URLs with a clear error", async () => {
    const remoteUrl = "https://cdn.example.com/fonts/iconfont.ttf";

    await expect(
      standalone({
        files: remoteUrl,
        formats: ["woff2"],
      }),
    ).rejects.toThrow(`Remote TTF URLs are not supported. Download the file first: ${remoteUrl}`);
  });

  it("should reject template option in ttf mode", async () => {
    await expect(
      standalone({
        files: fixtureTtf,
        formats: ["woff2"],
        template: "css",
      }),
    ).rejects.toThrow("Templates are not supported when converting TTF input");
  });

  it("should encode ttf input to a valid svg font when requested", async () => {
    const result = await standalone({
      files: fixtureTtf,
      formats: ["svg"],
    });

    expect(typeof result.svg).toBe("string");
    expect(isSvg(result.svg as string)).toBe(true);
    expect(result.woff).toBeUndefined();
    expect(result.glyphsData).toBeUndefined();
  });

  it("should reject formats without any ttf encoder output", async () => {
    await expect(
      standalone({
        files: fixtureTtf,
        formats: ["otf"],
      }),
    ).rejects.toThrow(
      'formats must include at least one of "svg", "ttf", "eot", "woff", or "woff2" when converting TTF input',
    );
  });

  it("should produce woff2 that decompresses back to valid ttf", async () => {
    const encoded = await standalone({ files: fixtureTtf, formats: ["woff2"] });
    const tempWoff2 = "temp/ttf-roundtrip.woff2";

    await fsPromise.mkdir("temp", { recursive: true });
    await fsPromise.writeFile(tempWoff2, encoded.woff2 as Buffer);

    try {
      const decompressed = await standalone({
        files: tempWoff2,
        formats: ["ttf"],
      });

      expect(isWoff2(encoded.woff2)).toBe(true);
      expect(isTtf(decompressed.ttf)).toBe(true);
    } finally {
      await fsPromise.rm(tempWoff2, { force: true });
    }
  });

  it("should transcode multiple ttf files in one run", async () => {
    const result = await standalone({
      files: [fixtureTtf, fixtureTtf],
      formats: ["woff2"],
    });

    expect(result.transcodedFonts).toHaveLength(2);
    expect(result.woff2).toBeUndefined();
    expect(result.transcodedFonts?.every((font) => isWoff2(font.woff2))).toBe(true);
  });
});
