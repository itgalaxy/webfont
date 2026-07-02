import crypto from "crypto";
import isEot from "is-eot";
import isSvg from "is-svg";
import isTtf from "is-ttf";
import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import path from "path";
import standalone from "../standalone";
import type { GlyphMetadata, GlyphTransformFn } from "../types";
import type { ResultConfig } from "../types/ResultConfig";

type DiscoveredRcConfig = ResultConfig & { foo: string };

const fixturesGlob = "src/fixtures";

describe("standalone", () => {
  it("should throw error if `files` not passed", async () => {
    await expect(standalone()).rejects.toThrow("You must pass webfont a `files` glob");
  });

  it("should throw error `files glob patterns specified did not match any files` if not found files", async () => {
    await expect(
      standalone({
        files: `${fixturesGlob}/not-found-svg-icons/**/*`,
      }),
    ).rejects.toThrow("Files glob patterns specified did not match any files");
  });

  it("should generate all fonts", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
  });

  // Need search better way to test `fs` delay
  it("should generate all fonts and will be deterministic", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);

    const svgHash = crypto.createHash("md5").update(result.svg).digest("hex");
    const ttfHash = crypto.createHash("md5").update(result.ttf).digest("hex");
    const eotHash = crypto.createHash("md5").update(result.eot).digest("hex");
    const woffHash = crypto.createHash("md5").update(result.woff).digest("hex");
    const woff2Hash = crypto.createHash("md5").update(result.woff2).digest("hex");

    expect(svgHash).toBe("1154313a3843c5f5ec70890715e8a527");
    expect(ttfHash).toBe("a78de3c54fa46d77540c2c96c4194f16");
    expect(eotHash).toBe("90ed04c53c7534b2e66979f6c0a94afe");
    expect(woffHash).toBe("20d0a901f75c638e7be9df714a93d5a0");
    expect(woff2Hash).toBe("60fe7d6d658fef07b9e8af362e4b8f36");
  });

  it("should generate only `svg`, `ttf` and `eot` fonts", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["svg", "ttf", "eot"],
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(result.woff).toBeUndefined();
    expect(result.woff2).toBeUndefined();
  });

  it("should generate only `woff2` font", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["woff2"],
    });

    expect(result.svg).toBeUndefined();
    expect(result.ttf).toBeUndefined();
    expect(result.eot).toBeUndefined();
    expect(result.woff).toBeUndefined();
    expect(isWoff2(result.woff2)).toBe(true);
  });

  it("should generate all fonts with build-in template", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
      templateCacheString: "test",
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.template).toMatchSnapshot();
  });

  it("should generate only `woff` and `woff2` fonts with build-in template", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["woff", "woff2"],
      template: "css",
      templateCacheString: "test",
    });

    expect(result.svg).toBeUndefined();
    expect(result.ttf).toBeUndefined();
    expect(result.eot).toBeUndefined();
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.template).toMatchSnapshot();
  });

  it("should generate all fonts with custom `template` with absolute path", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: path.join(fixturesGlob, "templates/template.css"),
      templateCacheString: "test",
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.template).toMatchSnapshot();
  });

  it("should generate all fonts with custom `template` with relative path", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "src/fixtures/templates/template.css",
      templateCacheString: "test",
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.template).toMatchSnapshot();
  });

  it("should load config and export file path in result", async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc");
    const result = await standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`,
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect((result.config as DiscoveredRcConfig).foo).toBe("bar");
    expect(result.config.filePath).toBe(path.resolve(configFile));
  });

  it("should load config and respect `template` option with build-in template value", async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc-with-build-in-template");

    const result = await standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`,
      templateCacheString: "test",
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.config.template).toBe("scss");
    expect(result.template).toMatchSnapshot();
  });

  it("should load config and respect `template` option with external template value", async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc-with-external-template");
    const result = await standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`,
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.config.template).toBe("src/fixtures/templates/template.css");
    expect(result.template).toMatchSnapshot();
  });

  it("should load config and respect `formats` option", async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc-with-custom-formats");
    const result = await standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`,
    });

    expect(result.svg).toBeUndefined();
    expect(result.ttf).toBeUndefined();
    expect(result.eot).toBeUndefined();
    expect(result.woff).toBeUndefined();
    expect(isWoff2(result.woff2)).toBe(true);
  });

  it("should generate the ordered output source in the same order of entry", async () => {
    expect.assertions(1);

    const templateOutput = `
    .webfont-envelope::before {
      content: "\\ea01";
    }
    .webfont-avatar::before {
      content: "\\ea02";
    }
  `;
    const result = await standalone({
      files: [`${fixturesGlob}/svg-icons/envelope.svg`, `${fixturesGlob}/svg-icons/avatar.svg`],
      sort: false,
      template: path.join(fixturesGlob, "templates/template-ordered.css"),
    });

    const actual = templateOutput.replace(/\s/gu, "");
    const expected = result.template.replace(/\s/gu, "");

    expect(actual).toBe(expected);
  });

  it("should throw error on bad svg images - `Unclosed root tag`", async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    await expect(
      standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar.svg`,
      }),
    ).rejects.toThrow(/Unclosed root tag/u);
  });

  it("should throw error on bad svg images - `Unterminated command at index`", async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    await expect(
      standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-1.svg`,
      }),
    ).rejects.toThrow(/Unterminated command at index/u);
  });

  it('should throw error on bad svg images - `Unexpected character "N"`', async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    await expect(
      standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-2.svg`,
      }),
    ).rejects.toThrow(/Unexpected character "N"/u);
  });

  it("should throw error on bad svg images - empty file", async () => {
    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    await expect(
      standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-3.svg`,
      }),
    ).rejects.toThrow(/Empty file/u);
  });

  it("should throw error of config file not found", async () => {
    const configFile = path.join(fixturesGlob, "configs/.not-exist-webfontrc");

    await expect(
      standalone({
        configFile,
        files: `${fixturesGlob}/svg-icons/**/*`,
      }),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("should create css selectors with transform titles through function", async () => {
    const glyphTransformFn: GlyphTransformFn = (obj) => {
      obj.name += "_transform";

      return obj;
    };

    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["eot"],
      glyphTransformFn,
      template: "css",
      templateCacheString: "test",
    });

    expect(result.template).toMatchSnapshot();
  });

  it("should change unicode symbols in the result using sync function", async () => {
    const { template } = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["eot"],
      glyphTransformFn: (obj: GlyphMetadata) => {
        obj.unicode = ["\u0001"];

        return obj;
      },
      template: "css",
      templateCacheString: "test",
    });
    expect(template).toMatchSnapshot();
  });

  it("should change unicode symbols in the result using async function", async () => {
    const { template } = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["eot"],
      glyphTransformFn: (obj: GlyphMetadata) => {
        obj.unicode = ["\u0001"];

        return Promise.resolve(obj);
      },
      template: "css",
      templateCacheString: "test",
    });
    expect(template).toMatchSnapshot();
  });

  it("should handle errors properly", async () => {
    try {
      await standalone({
        files: `${fixturesGlob}/svg-icons/**/*`,
        formats: ["eot"],
        glyphTransformFn: () => {
          throw new Error("Name is invalid");
        },
        template: "css",
      });
    } catch (error) {
      expect(error.message).toMatch("Name is invalid");
    }
  });

  it("should respect `template` options", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
      templateCacheString: "test",
      templateClassName: "foo",
      templateFontName: "bar",
      templateFontPath: "./foo-bar",
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.config.template).toBe("css");
    expect(result.usedBuildInTemplate).toBe(true);
    expect(result.template).toMatchSnapshot();
  });

  it("should generate built-in html template", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "html",
      templateCacheString: "test",
    });

    expect(result.usedBuildInTemplate).toBe(true);
    expect(result.template).toContain("<!doctype html>");
    expect(result.template).toMatchSnapshot();
  });

  it("should generate built-in json template", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "json",
      templateCacheString: "test",
    });

    expect(result.usedBuildInTemplate).toBe(true);
    expect(JSON.parse(result.template)).toMatchSnapshot();
    expect(result.template).toMatchSnapshot();
  });

  it("should generate built-in styl template", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "styl",
      templateCacheString: "test",
    });

    expect(result.usedBuildInTemplate).toBe(true);
    expect(result.template).toMatchSnapshot();
  });

  it("should include font hash in template URLs when addHashInFontUrl is enabled", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
      templateCacheString: "test",
      addHashInFontUrl: true,
      formats: ["woff2"],
    });

    expect(result.hash).toBeTruthy();
    expect(result.template).toContain(`&v=${result.hash}`);
    expect(result.template).toMatchSnapshot();
  });

  it("should export `glyphsData` in `result`", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
    });

    expect(Array.isArray(result.glyphsData)).toBe(true);
    expect(result.glyphsData.length > 0).toBe(true);
  });

  it("should remove ligature unicode when `ligatures` set to `false`", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      ligatures: false,
      template: "css",
    });

    expect(Array.isArray(result.glyphsData)).toBe(true);
    expect(result.glyphsData.length > 0).toBe(true);

    result.glyphsData.forEach((glyph) => {
      expect(glyph.metadata?.unicode).toHaveLength(1);
    });
  });

  it("should export `hash` in `result`", () => {
    expect.assertions(1);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
    }).then((result) => {
      expect(result.hash).toBe("1154313a3843c5f5ec70890715e8a527");

      return result;
    });
  });
});
