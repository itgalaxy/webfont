import crypto from "crypto";
import isEot from "is-eot";
import isSvg from "is-svg";
import isTtf from "is-ttf";
import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import path from "path";
import standalone from "../standalone";

const fixturesGlob = "src/__tests__/fixtures";

describe("standalone", () => {
  it("should throw error if `files` not passed", () =>
    expect(() => standalone()).toThrow("You must pass webfont a `files` glob"));

  it("should throw error `files glob patterns specified did not match any files` if not found files", () =>
    standalone({
      files: `${fixturesGlob}/not-found-svg-icons/**/*`
    }).catch(error =>
      expect(error.message).toMatch(
        "Files glob patterns specified did not match any files"
      )
    ));

  it("should generate all fonts", () => {
    expect.assertions(5);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);

      return result;
    });
  });

  // Need search better way to test `fs` delay
  it("should generate all fonts and will be deterministic", () => {
    expect.assertions(10);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`
    }).then(result => {
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
      expect(woff2Hash).toBe("8c0bd62996d1e84ebd01263adf6aa163");

      return result;
    });
  });

  it("should generate only `svg`, `ttf` and `eot` fonts", () => {
    expect.assertions(5);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["svg", "ttf", "eot"]
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(result.woff).toBeUndefined();
      expect(result.woff2).toBeUndefined();

      return result;
    });
  });

  it("should generate only `woff2` font", () => {
    expect.assertions(5);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["woff2"]
    }).then(result => {
      expect(result.svg).toBeUndefined();
      expect(result.ttf).toBeUndefined();
      expect(result.eot).toBeUndefined();
      expect(result.woff).toBeUndefined();
      expect(isWoff2(result.woff2)).toBe(true);

      return result;
    });
  });

  it("should generate all fonts with build-in template", () => {
    expect.assertions(8);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css"
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.template).toMatch(/\.webfont-avatar/);
      expect(result.template).toMatch(/\.webfont-envelope/);
      expect(result.template).toMatch(/\.webfont-phone-call/);

      return result;
    });
  });

  it("should generate only `woff and `woff2` fonts with build-in template", () => {
    expect.assertions(8);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["woff", "woff2"],
      template: "css"
    }).then(result => {
      expect(result.svg).toBeUndefined();
      expect(result.ttf).toBeUndefined();
      expect(result.eot).toBeUndefined();
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.template).toMatch(/\.webfont-avatar/);
      expect(result.template).toMatch(/\.webfont-envelope/);
      expect(result.template).toMatch(/\.webfont-phone-call/);

      return result;
    });
  });

  it("should generate all fonts with custom `template` with absolute path", () => {
    expect.assertions(9);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: path.join(fixturesGlob, "templates/template.css")
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.template).toMatch(/\/\*\scustom template\s\*\//);
      expect(result.template).toMatch(/\.webfont-avatar/);
      expect(result.template).toMatch(/\.webfont-envelope/);
      expect(result.template).toMatch(/\.webfont-phone-call/);

      return result;
    });
  });

  it("should generate all fonts with custom `template` with relative path", () => {
    expect.assertions(9);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "src/__tests__/fixtures/templates/template.css"
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.template).toMatch(/\/\*\scustom template\s\*\//);
      expect(result.template).toMatch(/\.webfont-avatar/);
      expect(result.template).toMatch(/\.webfont-envelope/);
      expect(result.template).toMatch(/\.webfont-phone-call/);

      return result;
    });
  });

  it("should load config and export file path in result", () => {
    expect.assertions(6);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    return standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.config.foo).toBe("bar");

      return result;
    });
  });

  it("should load config and respect `template` option with build-in template value", () => {
    expect.assertions(9);

    const configFile = path.join(
      fixturesGlob,
      "configs/.webfontrc-with-build-in-template"
    );

    return standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.config.template).toBe("scss");
      expect(result.template).toMatch(/\.webfont-avatar/);
      expect(result.template).toMatch(/\.webfont-envelope/);
      expect(result.template).toMatch(/\.webfont-phone-call/);

      return result;
    });
  });

  it("should load config and respect `template` option with external template value", () => {
    expect.assertions(9);

    const configFile = path.join(
      fixturesGlob,
      "configs/.webfontrc-with-external-template"
    );

    return standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.config.template).toBe(
        "src/__tests__/fixtures/templates/template.css"
      );
      expect(result.template).toMatch(/\.webfont-avatar/);
      expect(result.template).toMatch(/\.webfont-envelope/);
      expect(result.template).toMatch(/\.webfont-phone-call/);

      return result;
    });
  });

  it("should generate the ordered output source in the same order of entry", () => {
    expect.assertions(1);

    const templateOutput = `
    .webfont-envelope::before {
      content: "\\ea01";
    }
    .webfont-avatar::before {
      content: "\\ea02";
    }
  `;

    return standalone({
      files: [
        `${fixturesGlob}/svg-icons/envelope.svg`,
        `${fixturesGlob}/svg-icons/avatar.svg`
      ],
      sort: false,
      template: path.join(fixturesGlob, "templates/template-ordered.css")
    }).then(result => {
      expect(templateOutput.replace(/(\n|\r|\s)/g, "")).toBe(
        result.template.replace(/(\n|\r|\s)/g, "")
      );

      return result;
    });
  });

  it("should throw error on bad svg images - `Unclosed root tag`", () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    return standalone({
      configFile,
      files: `${fixturesGlob}/bad-svg-icons/avatar.svg`
    }).catch(error => {
      expect(error.message).toMatch(/Unclosed root tag/);
    });
  });

  it("should throw error on bad svg images - `Unterminated command at index`", () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    return standalone({
      configFile,
      files: `${fixturesGlob}/bad-svg-icons/avatar-1.svg`
    }).catch(error => {
      expect(error.message).toMatch(/Unterminated command at index/);
    });
  });

  it('should throw error on bad svg images - `Unexpected character "N"`', () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    return standalone({
      configFile,
      files: `${fixturesGlob}/bad-svg-icons/avatar-2.svg`
    }).catch(error => {
      expect(error.message).toMatch(/Unexpected character "N"/);
    });
  });

  it("should throw error on bad svg images - empty file", () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.webfontrc");

    return standalone({
      configFile,
      files: `${fixturesGlob}/bad-svg-icons/avatar-3.svg`
    }).catch(error => {
      expect(error.message).toMatch(/Empty file/);
    });
  });

  it("should throw error of config file not found", () => {
    expect.assertions(1);

    const configFile = path.join(fixturesGlob, "configs/.not-exist-webfontrc");

    return standalone({
      configFile,
      files: `${fixturesGlob}/svg-icons/**/*`
    }).catch(error => {
      expect(error.code).toBe("ENOENT");
    });
  });

  it("should create css selectors with transform titles through function", () => {
    expect.assertions(3);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      formats: ["eot"],
      glyphTransformFn: obj => {
        obj.name += "_transform";

        return obj;
      },
      template: "css"
    }).then(result => {
      expect(result.template).toMatch(/\.webfont-avatar_transform/);
      expect(result.template).toMatch(/\.webfont-envelope_transform/);
      expect(result.template).toMatch(/\.webfont-phone-call_transform/);

      return result;
    });
  });

  it("should respect `template` options", () => {
    expect.assertions(11);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css",
      templateClassName: "foo",
      templateFontName: "bar",
      templateFontPath: "./foo-bar"
    }).then(result => {
      expect(isSvg(result.svg)).toBe(true);
      expect(isTtf(result.ttf)).toBe(true);
      expect(isEot(result.eot)).toBe(true);
      expect(isWoff(result.woff)).toBe(true);
      expect(isWoff2(result.woff2)).toBe(true);
      expect(result.config.template).toBe("css");
      expect(result.usedBuildInTemplate).toBe(true);
      expect(result.template).toMatch(/\.foo-avatar/);
      expect(result.template).toMatch(/\.foo-envelope/);
      expect(result.template).toMatch(/\.foo-phone-call/);
      expect(result.template).toMatch(/url\("\.\/foo-bar\/bar\.eot"\)/);

      return result;
    });
  });

  it("should export `glyphsData` in `result`", () => {
    expect.assertions(2);

    return standalone({
      files: `${fixturesGlob}/svg-icons/**/*`,
      template: "css"
    }).then(result => {
      expect(Array.isArray(result.glyphsData)).toBe(true);
      expect(result.glyphsData.length > 0).toBe(true);

      return result;
    });
  });
});
