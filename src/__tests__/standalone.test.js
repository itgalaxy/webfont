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
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toMatch("You must pass webfont a `files` glob");
    }
  });

  it("should throw error `files glob patterns specified did not match any files` if not found files", async () => {
    expect.assertions(1);

    try {
      await standalone({
        files: `${fixturesGlob}/not-found-svg-icons/**/*`,
      });
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toMatch(
        "Files glob patterns specified did not match any files"
      );
    }
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

    expect(svgHash).toBe("5babeea3094bba0b5e2001390b0811fd");
    expect(ttfHash).toBe("5d9b24d5475efb8d24babb2444fc8108");
    expect(eotHash).toBe("024ccffe146cfdbcc501241516479f16");
    expect(woffHash).toBe("6a11601283f57dd7d016ac91bc33179a");
    expect(woff2Hash).toBe("6f372f4721c1706c99fb6230f800ef0f");
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
      template: "src/__tests__/fixtures/templates/template.css",
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
    expect(result.config.foo).toBe("bar");
  });

  it("should generate all fonts with multiple templates (built-in and custom)", () => {
    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: ["css", "src/__tests__/fixtures/templates/template.css"],
      templateCacheString: "test",
    })
      .then(result => {
        expect(isSvg(result.svg)).toBe(true);
        expect(isTtf(result.ttf)).toBe(true);
        expect(isEot(result.eot)).toBe(true);
        expect(isWoff(result.woff)).toBe(true);
        expect(isWoff2(result.woff2)).toBe(true);
        expect(result.template).toMatchSnapshot();
        expect(Array.isArray(result.templates)).toBe(true);
        expect(result.templates[0].content).toMatchSnapshot();
        expect(result.templates[1].content).toMatchSnapshot();
      });
  });

  it("should generate all fonts with multiple template-configs supplied as array of objects", () => {
    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: [
        {file: 'css', outDir: 'dist/__tests__/resources/css'},
        {file: 'src/__tests__/fixtures/templates/template.css', outDir: 'dist/__tests__/resources/css'}
      ],
      templateCacheString: "test",
    })
      .then(result => {
        expect(isSvg(result.svg)).toBe(true);
        expect(isTtf(result.ttf)).toBe(true);
        expect(isEot(result.eot)).toBe(true);
        expect(isWoff(result.woff)).toBe(true);
        expect(isWoff2(result.woff2)).toBe(true);
        expect(result.template).toMatchSnapshot();
        expect(Array.isArray(result.templates)).toBe(true);
        expect(result.templates[0].content).toMatchSnapshot();
        expect(result.templates[1].content).toMatchSnapshot();
      });
  });

  it("should load config and respect `template` option with build-in template value", async () => {
    const configFile = path.join(
      fixturesGlob,
      "configs/.webfontrc-with-build-in-template"
    );

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
    expect(Array.isArray(result.templates)).toBe(true);
    expect(result.templates[0].content).toMatchSnapshot();
  });

  it("should load config and respect `template` option with external template value", async () => {
    const configFile = path.join(
      fixturesGlob,
      "configs/.webfontrc-with-external-template"
    );
    const result = await standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`,
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
    expect(Array.isArray(result.templates)).toBe(true);
    expect(result.templates[0].content).toMatchSnapshot();
  });

  it("should load config and respect `formats` option", async () => {
    const configFile = path.join(
      fixturesGlob,
      "configs/.webfontrc-with-custom-formats"
    );
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
      files: [
        `${fixturesGlob}/svg-icons/envelope.svg`,
        `${fixturesGlob}/svg-icons/avatar.svg`,
      ],
      sort: false,
      template: path.join(fixturesGlob, "templates/template-ordered.css"),
    });

    expect(templateOutput.replace(/(\s)/g, "")).toBe(
      result.template.replace(/(\s)/g, "")
    );
  });

  it("should throw error on bad svg images - `Unclosed root tag`", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar.svg`,
      });
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toMatch(/Unclosed root tag/);
    }
  });

  it("should throw error on bad svg images - `Unterminated command at index`", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-1.svg`,
      });
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toMatch(/Unterminated command at index/);
    }
  });

  it('should throw error on bad svg images - `Unexpected character "N"`', async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-2.svg`,
      });
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toMatch(/Unexpected character "N"/);
    }
  });

  it("should throw error on bad svg images - empty file", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/bad-svg-icons/avatar-3.svg`,
      });
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toMatch(/Empty file/);
    }
  });

  it("should throw error of config file not found", async () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.not-exist-webfontrc");

    try {
      await standalone({
        configFile,
        files: `${fixturesGlob}/svg-icons/**/*`,
      });
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.code).toBe("ENOENT");
    }
  });

  it("should create css selectors with transform titles through function", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["eot"],
      glyphTransformFn: (obj) => {
        obj.name += "_transform";

        return obj;
      },
      template: "css",
      templateCacheString: "test",
    });

    expect(result.template).toMatchSnapshot();
    expect(Array.isArray(result.templates)).toBe(true);
    expect(result.templates[0].content).toMatchSnapshot();
  });

  it("should respect `template` options", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
      templateClassName: "foo",
      templateFontName: "bar",
      templateFontPath: "./foo-bar",
      templateCacheString: "test",
    });

    expect(isSvg(result.svg)).toBe(true);
    expect(isTtf(result.ttf)).toBe(true);
    expect(isEot(result.eot)).toBe(true);
    expect(isWoff(result.woff)).toBe(true);
    expect(isWoff2(result.woff2)).toBe(true);
    expect(result.config.template).toBe("css");
    expect(result.usedBuildInTemplate).toBe(true);
    expect(result.template).toMatchSnapshot();
    expect(Array.isArray(result.templates)).toBe(true);
    expect(result.templates[0].content).toMatchSnapshot();
  });

  it("should override general options if template specific options are set", () => {
    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: [{
        file: 'css',
        className: "foo",
        fontPath: "./foo-bar"
      }],
      templateClassName: "fizz",
      templateFontName: "bar",
      templateFontPath: "./fizz-buzz",
      templateCacheString: "test",
    })
      .then(result => {
        expect(result.template).toMatchSnapshot();
        expect(Array.isArray(result.templates)).toBe(true);
        expect(result.templates[0].content).toMatchSnapshot();
      });
  });

  it("should export `glyphsData` in `result`", async () => {
    const result = await standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
    });

    expect(Array.isArray(result.glyphsData)).toBe(true);
    expect(result.glyphsData.length > 0).toBe(true);
  });

  it("should respect options set in config and generate output", () => {
    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      configFile: './src/__tests__/fixtures/configs/webfont.config.js'
    })
      .then(result => {
        expect(isSvg(result.svg)).toBe(false);
        expect(isTtf(result.ttf)).toBe(false);
        expect(isEot(result.eot)).toBe(false);
        expect(isWoff(result.woff)).toBe(false);
        expect(isWoff2(result.woff2)).toBe(true);
        expect(Array.isArray(result.templates)).toBe(true);
        expect(result.templates.length).toBe(2);
      });
  });

  it("should export `hash` in `result`", () => {
    expect.assertions(1);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
    }).then((result) => {
      expect(result.hash).toBe("2ca03c1940ac8a064c615ab11a7b9abc");

      return result;
    });
  });

  it("should export `hash` for each individual font", () => {
    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
    })
      .then(result => {
        const hashes = {};
        result.fonts.forEach(fontResult => {hashes[fontResult.format] = fontResult.hash});

        expect(hashes).toEqual({
          hash : "2ca03c1940ac8a064c615ab11a7b9abc",
          svg  : "5babeea3094bba0b5e2001390b0811fd",
          ttf  : "5d9b24d5475efb8d24babb2444fc8108",
          eot  : "024ccffe146cfdbcc501241516479f16",
          woff : "6a11601283f57dd7d016ac91bc33179a",
          woff2: "6f372f4721c1706c99fb6230f800ef0f",
        });
      });
  });
});
