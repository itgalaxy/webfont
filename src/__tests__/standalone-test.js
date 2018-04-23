import crypto from "crypto";
import isEot from "is-eot";
import isSvg from "is-svg";
import isTtf from "is-ttf";
import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import path from "path";
import standalone from "../standalone";
import test from "ava";

const fixturesPath = path.join(__dirname, "fixtures");

test("should throw error if `files` not passed", t =>
  t.throws(() => standalone(), "You must pass webfont a `files` glob"));

test("should throw error `files glob patterns specified did not match any files` if not found files", t =>
  t.throws(
    standalone({
      files: `${fixturesPath}/not-found-svg-icons/**/*`
    }),
    "Files glob patterns specified did not match any files"
  ));

test("should generate all fonts", t => {
  t.plan(5);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));

    return result;
  });
});

// Need search better way to test `fs` delay
test("should generate all fonts and will be deterministic", t => {
  t.plan(10);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));

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

    t.true(svgHash === "ead2b6f69fc603bf1cbd00bf9f8a8a33");
    t.true(ttfHash === "8ffaa42f84b0835c7c250ec16e8f5d78");
    t.true(eotHash === "cc86496a4fd871e31a79043a7ba96a07");
    t.true(woffHash === "e90fb075e22ab56621e1caf13c52ef17");
    t.true(woff2Hash === "8c0bd62996d1e84ebd01263adf6aa163");

    return result;
  });
});

test("should generate only `svg`, `ttf` and `eot` fonts", t => {
  t.plan(5);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    formats: ["svg", "ttf", "eot"]
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(typeof result.woff === "undefined");
    t.true(typeof result.woff2 === "undefined");

    return result;
  });
});

test("should generate only `woff2` font", t => {
  t.plan(5);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    formats: ["woff2"]
  }).then(result => {
    t.true(typeof result.svg === "undefined");
    t.true(typeof result.ttf === "undefined");
    t.true(typeof result.eot === "undefined");
    t.true(typeof result.woff === "undefined");
    t.true(isWoff2(result.woff2));

    return result;
  });
});

test("should generate all fonts with build-in template", t => {
  t.plan(8);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    template: "css"
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.regex(result.template, /\.webfont-avatar/);
    t.regex(result.template, /\.webfont-envelope/);
    t.regex(result.template, /\.webfont-phone-call/);

    return result;
  });
});

test("should generate only `woff and `woff2` fonts with build-in template", t => {
  t.plan(8);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    formats: ["woff", "woff2"],
    template: "css"
  }).then(result => {
    t.true(typeof result.svg === "undefined");
    t.true(typeof result.ttf === "undefined");
    t.true(typeof result.eot === "undefined");
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.regex(result.template, /\.webfont-avatar/);
    t.regex(result.template, /\.webfont-envelope/);
    t.regex(result.template, /\.webfont-phone-call/);

    return result;
  });
});

test("should generate all fonts with custom `template` with absolute path", t => {
  t.plan(9);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    template: path.join(fixturesPath, "templates/template.css")
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.regex(result.template, /\/\*\scustom template\s\*\//);
    t.regex(result.template, /\.webfont-avatar/);
    t.regex(result.template, /\.webfont-envelope/);
    t.regex(result.template, /\.webfont-phone-call/);

    return result;
  });
});

test("should generate all fonts with custom `template` with relative path", t => {
  t.plan(9);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    template: "src/__tests__/fixtures/templates/template.css"
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.regex(result.template, /\/\*\scustom template\s\*\//);
    t.regex(result.template, /\.webfont-avatar/);
    t.regex(result.template, /\.webfont-envelope/);
    t.regex(result.template, /\.webfont-phone-call/);

    return result;
  });
});

test("should load config and export file path in result", t => {
  t.plan(7);

  const configFile = path.join(fixturesPath, "configs/.webfontrc");

  return standalone({
    configFile,
    files: `${fixturesPath}/svg-icons/**/*`
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.true(result.config.foo === "bar");
    t.true(result.config.filePath === configFile);

    return result;
  });
});

test("should load config and respect `template` option with build-in template value", t => {
  t.plan(9);

  const configFile = path.join(
    fixturesPath,
    "configs/.webfontrc-with-build-in-template"
  );

  return standalone({
    configFile,
    files: `${fixturesPath}/svg-icons/**/*`
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.true(result.config.template === "scss");
    t.regex(result.template, /\.webfont-avatar/);
    t.regex(result.template, /\.webfont-envelope/);
    t.regex(result.template, /\.webfont-phone-call/);

    return result;
  });
});

test("should load config and respect `template` option with external template value", t => {
  t.plan(9);

  const configFile = path.join(
    fixturesPath,
    "configs/.webfontrc-with-external-template"
  );

  return standalone({
    configFile,
    files: `${fixturesPath}/svg-icons/**/*`
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.true(
      result.config.template === "src/__tests__/fixtures/templates/template.css"
    );
    t.regex(result.template, /\.webfont-avatar/);
    t.regex(result.template, /\.webfont-envelope/);
    t.regex(result.template, /\.webfont-phone-call/);

    return result;
  });
});

test("should throw error on bad svg images - `Unclosed root tag`", t => {
  t.plan(1);

  const configFile = path.join(fixturesPath, "configs/.webfontrc");

  return standalone({
    configFile,
    files: `${fixturesPath}/bad-svg-icons/avatar.svg`
  }).catch(error => {
    t.regex(error.message, /Unclosed root tag/);
  });
});

test("should throw error on bad svg images - `Unterminated command at index`", t => {
  t.plan(1);

  const configFile = path.join(fixturesPath, "configs/.webfontrc");

  return standalone({
    configFile,
    files: `${fixturesPath}/bad-svg-icons/avatar-1.svg`
  }).catch(error => {
    t.regex(error.message, /Unterminated command at index/);
  });
});

test('should throw error on bad svg images - `Unexpected character "N"`', t => {
  t.plan(1);

  const configFile = path.join(fixturesPath, "configs/.webfontrc");

  return standalone({
    configFile,
    files: `${fixturesPath}/bad-svg-icons/avatar-2.svg`
  }).catch(error => {
    t.regex(error.message, /Unexpected character "N"/);
  });
});

test("should throw error on bad svg images - empty file", t => {
  t.plan(1);

  const configFile = path.join(fixturesPath, "configs/.webfontrc");

  return standalone({
    configFile,
    files: `${fixturesPath}/bad-svg-icons/avatar-3.svg`
  }).catch(error => {
    t.regex(error.message, /Empty file/);
  });
});

test("should throw error of config file not found", t => {
  t.plan(1);

  const configFile = path.join(fixturesPath, "configs/.not-exist-webfontrc");

  return standalone({
    configFile,
    files: `${fixturesPath}/svg-icons/**/*`
  }).catch(error => {
    t.true(error.code === "ENOENT");
  });
});

test("should create css selectors with transform titles through function", t => {
  t.plan(3);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    formats: ["eot"],
    glyphTransformFn: obj => {
      obj.name += "_transform";

      return obj;
    },
    template: "css"
  }).then(result => {
    t.regex(result.template, /\.webfont-avatar_transform/);
    t.regex(result.template, /\.webfont-envelope_transform/);
    t.regex(result.template, /\.webfont-phone-call_transform/);

    return result;
  });
});

test("should respect `template` options", t => {
  t.plan(12);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    template: "css",
    templateClassName: "foo",
    templateFontName: "bar",
    templateFontPath: "./foo-bar"
  }).then(result => {
    t.true(isSvg(result.svg));
    t.true(isTtf(result.ttf));
    t.true(isEot(result.eot));
    t.true(isWoff(result.woff));
    t.true(isWoff2(result.woff2));
    t.true(result.config.template === "css");
    t.true(result.usedBuildInTemplate);
    t.regex(result.template, /\.foo-avatar/);
    t.regex(result.template, /\.foo-envelope/);
    t.regex(result.template, /\.foo-phone-call/);
    t.regex(result.template, /\.foo-phone-call/);
    t.regex(result.template, /url\("\.\/foo-bar\/bar\.eot"\)/);

    return result;
  });
});

test("should export `glyphsData` in `result`", t => {
  t.plan(2);

  return standalone({
    files: `${fixturesPath}/svg-icons/**/*`,
    template: "css"
  }).then(result => {
    t.true(Array.isArray(result.glyphsData));
    t.true(result.glyphsData.length > 0);

    return result;
  });
});
