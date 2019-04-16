import crypto from "crypto";
import path from "path";
import isEot from "is-eot";
import isSvg from "is-svg";
import isTtf from "is-ttf";
import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import standalone from "../standalone";

const fixturesGlob = "src/__tests__/fixtures";

describe("standalone", () => {
  it("should throw error if `files` not passed", async () => {
    try {
      await standalone();
    } catch (error) {
      expect(error.message).toMatch("You must pass webfont a `files` glob");
    }
  });

  it("should throw error `files glob patterns specified did not match any files` if not found files", async () => {
    expect.assertions(1);

    try {
      await standalone({
        files: `${fixturesGlob}/not-found-svg-icons/**/*`
      });
    } catch (error) {
      expect(error.message).toMatch(
        "Files glob patterns specified did not match any files"
      );
    }
  });

  it("should generate all fonts", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`
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
      files: `${fixturesGlob}/svg-icons/**/*`
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);

    const svgHash = crypto
      .createHash("md5")
      .update(result.svg)
      .digest("hex");
    const ttfHash = crypto
      .createHash("md5")
      .update(result.ttf)
      .digest("hex");
    const eotHash = crypto
      .createHash("md5")
      .update(result.eot)
      .digest("hex");
    const woffHash = crypto
      .createHash("md5")
      .update(result.woff)
      .digest("hex");
    const woff2Hash = crypto
      .createHash("md5")
      .update(result.woff2)
      .digest("hex");

    expect(svgHash).toBe("ead2b6f69fc603bf1cbd00bf9f8a8a33");
    expect(ttfHash).toBe("8ffaa42f84b0835c7c250ec16e8f5d78");
    expect(eotHash).toBe("cc86496a4fd871e31a79043a7ba96a07");
    expect(woffHash).toBe("e90fb075e22ab56621e1caf13c52ef17");
    expect(woff2Hash).toBe("c71b12c10bb6576528ef1a461c166e3a");
  });

  it("should generate only `svg`, `ttf` and `eot` fonts", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["svg", "ttf", "eot"]
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
      formats: ["woff2"]
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
      template: "css"
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
      template: "css"
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
      template: path.join(fixturesGlob, "templates/template.css")
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
      template: "src/__tests__/fixtures/templates/template.css"
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
      files: `${fixturesGlob}/svg-icons/**/*`
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.config.foo).toBe("bar");
  });

  it("should load config and respect `template` option with build-in template value", async () => {
    const configFile = path.join(
      fixturesGlob,
      "configs/.webfontrc-with-build-in-template"
    );

    const result = await standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`
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
    const configFile = path.join(
      fixturesGlob,
      "configs/.webfontrc-with-external-template"
    );
    const result = await standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.config.template).toBe(
      "src/__tests__/fixtures/templates/template.css"
    );
    expect(result.template).toMatchSnapshot();
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
      files: [
        `${fixturesGlob}/svg-icons/envelope.svg`,
        `${fixturesGlob}/svg-icons/avatar.svg`
      ],
      sort: false,
      template: path.join(fixturesGlob, "templates/template-ordered.css")
    });

    expect(templateOutput.replace(/(\n|\r|\s)/g, "")).toBe(
      result.template.replace(/(\n|\r|\s)/g, "")
    );
  });

  it("should throw error on bad svg images - `Unclosed root tag`", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar.svg`
      });
    } catch (error) {
      expect(error.message).toMatch(/Unclosed root tag/);
    }
  });

  it("should throw error on bad svg images - `Unterminated command at index`", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-1.svg`
      });
    } catch (error) {
      expect(error.message).toMatch(/Unterminated command at index/);
    }
  });

  it('should throw error on bad svg images - `Unexpected character "N"`', async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-2.svg`
      });
    } catch (error) {
      expect(error.message).toMatch(/Unexpected character "N"/);
    }
  });

  it("should throw error on bad svg images - empty file", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-3.svg`
      });
    } catch (error) {
      expect(error.message).toMatch(/Empty file/);
    }
  });

  it("should throw error of config file not found", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.not-exist-webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/svg-icons/**/*`
      });
    } catch (error) {
      expect(error.code).toBe("ENOENT");
    }
  });

  it("should create css selectors with transform titles through function", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["eot"],
      glyphTransformFn: obj => {
        obj.name += "_transform";

        return obj;
      },
      template: "css"
    });

    expect(result.template).toMatchSnapshot();
  });

  it("should respect `template` options", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
      templateClassName: "foo",
      templateFontName: "bar",
      templateFontPath: "./foo-bar"
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

  it("should export `glyphsData` in `result`", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css"
    });

    expect(Array.isArray(result.glyphsData)).toBe(true);
    expect(result.glyphsData.length > 0).toBe(true);
  });

  it("should export `hash` in `result`", () => {
    expect.assertions(1);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`
    }).then(result => {
      expect(result.hash).toBe("ead2b6f69fc603bf1cbd00bf9f8a8a33");

      return result;
    });
  });
});
