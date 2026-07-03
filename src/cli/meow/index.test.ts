import type { CliLike } from "../program";
import { buildOptionsBase } from "../program";
import { WEBFONT_CLI_HELP_MARKERS, webfontCliHelpText, webfontMeowFlags } from "./cliOptions";
import { createMeowCli } from "./createMeowCli";

const PROGRAM_CLI_FLAG_KEYS = [
  "addHashInFontUrl",
  "ascent",
  "centerHorizontally",
  "config",
  "descent",
  "dest",
  "destCreate",
  "destTemplate",
  "fixedWidth",
  "fontHeight",
  "fontId",
  "fontName",
  "fontStyle",
  "fontWeight",
  "formats",
  "help",
  "ligatures",
  "metadata",
  "normalize",
  "optimizeSvg",
  "prependUnicode",
  "round",
  "sort",
  "startUnicode",
  "template",
  "templateCacheString",
  "templateClassName",
  "templateFontName",
  "templateFontPath",
  "templateFontLigatures",
  "unicodeRange",
  "verbose",
  "svgDiagnose",
  "version",
] as const satisfies readonly (keyof CliLike["flags"])[];

const meowCliFlagKeys = Object.keys(webfontMeowFlags);

const wrapCli = (argv: readonly string[]): CliLike => {
  const meowCli = createMeowCli(argv);

  return {
    ...meowCli,
    showHelp: vi.fn(),
    showVersion: vi.fn(),
  };
};

const expectedHelpStdout = (): string => createMeowCli([]).help.replace(/\n$/u, "");

describe("cli/meow", () => {
  it("should load the meow package as a callable default export", async () => {
    // meow 14+ is ESM-only; Vitest resolves the default export object.
    const meow = await import("meow");

    expect(typeof meow.default).toBe("function");
  });

  it("should expose the same flag keys that program.ts reads from CliLike", () => {
    expect(meowCliFlagKeys.sort()).toEqual([...PROGRAM_CLI_FLAG_KEYS].sort());
  });

  it("should keep help text markers in sync with the documented CLI options", () => {
    for (const marker of WEBFONT_CLI_HELP_MARKERS) {
      expect(webfontCliHelpText).toContain(marker);
    }
  });

  describe("createMeowCli", () => {
    it("should parse positional input globs", () => {
      const cli = createMeowCli(["src/icons/*.svg", "more/*.svg"]);

      expect(cli.input).toEqual(["src/icons/*.svg", "more/*.svg"]);
    });

    it("should expose help text that matches the bundled CLI stdout contract", () => {
      expect(expectedHelpStdout()).toContain("Usage: webfont [input] [options]");
      expect(expectedHelpStdout()).toContain(
        "Generator of fonts from SVG icons; decompress WOFF/WOFF2 to embedded TTF/OTF",
      );
    });

    it("should parse --help and --version flags", () => {
      expect(createMeowCli(["--help"]).flags.help).toBe(true);
      expect(createMeowCli(["-h"]).flags.help).toBe(true);
      expect(createMeowCli(["--version"]).flags.version).toBe(true);
      expect(createMeowCli(["-v"]).flags.version).toBe(true);
    });

    it("should apply boolean defaults for sort, ligatures, unicodeRange, verbose, destCreate, and addHashInFontUrl", () => {
      const cli = createMeowCli(["input.svg"]);

      expect(cli.flags.sort).toBe(true);
      expect(cli.flags.ligatures).toBe(true);
      expect(cli.flags.unicodeRange).toBe(true);
      expect(cli.flags.templateFontLigatures).toBe(true);
      expect(cli.flags.verbose).toBe(false);
      expect(cli.flags.destCreate).toBe(false);
      expect(cli.flags.addHashInFontUrl).toBe(false);
      expect(cli.flags.optimizeSvg).toBe(false);
      expect(cli.flags.templateCacheString).toBe("");
    });

    it("should parse --no-sort, --no-ligatures, --no-unicode-range, and --no-template-font-ligatures negated booleans", () => {
      const cli = createMeowCli([
        "input.svg",
        "--no-sort",
        "--no-ligatures",
        "--no-unicode-range",
        "--no-template-font-ligatures",
      ]);

      expect(cli.flags.sort).toBe(false);
      expect(cli.flags.ligatures).toBe(false);
      expect(cli.flags.unicodeRange).toBe(false);
      expect(cli.flags.templateFontLigatures).toBe(false);
    });

    it("should parse short aliases for common flags", () => {
      const cli = createMeowCli([
        "icons/*.svg",
        "-d",
        "temp/out",
        "-m",
        "-u",
        "alias-font",
        "-f",
        "woff2",
        "-t",
        "css",
        "-s",
        "temp/templates",
        "-c",
        "icon",
        "-n",
        "icon-font",
        "-p",
        "./fonts",
        "--verbose",
      ]);

      expect(cli.flags.dest).toBe("temp/out");
      expect(cli.flags.destCreate).toBe(true);
      expect(cli.flags.fontName).toBe("alias-font");
      expect(cli.flags.formats).toBe("woff2");
      expect(cli.flags.template).toBe("css");
      expect(cli.flags.destTemplate).toBe("temp/templates");
      expect(cli.flags.templateClassName).toBe("icon");
      expect(cli.flags.templateFontName).toBe("icon-font");
      expect(cli.flags.templateFontPath).toBe("./fonts");
      expect(cli.flags.verbose).toBe(true);
    });

    it("should default argv to process.argv.slice(2) when omitted", () => {
      const originalArgv = process.argv;

      process.argv = ["node", "webfont", "--help"];

      try {
        expect(createMeowCli().flags.help).toBe(true);
      } finally {
        process.argv = originalArgv;
      }
    });

    it("should parse svgicons2svgfont-related flags", () => {
      const cli = createMeowCli([
        "icons/*.svg",
        "--fontId",
        "id",
        "--fontStyle",
        "italic",
        "--fontWeight",
        "700",
        "--fixedWidth",
        "--centerHorizontally",
        "--normalize",
        "--fontHeight",
        "100",
        "--round",
        "1",
        "--descent",
        "5",
        "--ascent",
        "10",
        "--startUnicode",
        "0xea01",
        "--prependUnicode",
        "--metadata",
        "meta",
        "--addHashInFontUrl",
      ]);

      expect(cli.flags.fontId).toBe("id");
      expect(cli.flags.fontStyle).toBe("italic");
      expect(cli.flags.fontWeight).toBe("700");
      expect(cli.flags.fixedWidth).toBe(true);
      expect(cli.flags.centerHorizontally).toBe(true);
      expect(cli.flags.normalize).toBe(true);
      expect(cli.flags.fontHeight).toBe("100");
      expect(cli.flags.round).toBe("1");
      expect(cli.flags.descent).toBe("5");
      expect(cli.flags.ascent).toBe("10");
      expect(cli.flags.startUnicode).toBe("0xea01");
      expect(cli.flags.prependUnicode).toBe(true);
      expect(cli.flags.metadata).toBe("meta");
      expect(cli.flags.addHashInFontUrl).toBe(true);
    });

    it("should parse --config and --templateCacheString", () => {
      const cli = createMeowCli(["icons/*.svg", "--config", "webfont.config.js", "--templateCacheString", "v=1"]);

      expect(cli.flags.config).toBe("webfont.config.js");
      expect(cli.flags.templateCacheString).toBe("v=1");
    });

    it("should map parsed argv into buildOptionsBase the same way program.ts expects", () => {
      const options = buildOptionsBase(
        wrapCli([
          "src/fixtures/svg-icons/*.svg",
          "-d",
          "temp/out",
          "-m",
          "-u",
          "parsed-font",
          "-f",
          '["woff2"]',
          "-t",
          "css",
          "-s",
          "temp/templates",
          "-c",
          "icon",
          "-n",
          "icon-font",
          "-p",
          "./fonts",
          "--templateCacheString",
          "cache",
          "--verbose",
          "--fontId",
          "id",
          "--fontStyle",
          "italic",
          "--fontWeight",
          "700",
          "--fixedWidth",
          "--centerHorizontally",
          "--normalize",
          "--fontHeight",
          "100",
          "--round",
          "1",
          "--descent",
          "5",
          "--ascent",
          "10",
          "--startUnicode",
          "0xea01",
          "--prependUnicode",
          "--metadata",
          "meta",
          "--no-sort",
          "--no-ligatures",
          "--no-unicode-range",
          "--addHashInFontUrl",
          "--config",
          "webfont.config.js",
        ]),
      );

      expect(options.fontName).toBe("parsed-font");
      expect(options.formats).toEqual(["woff2"]);
      expect(options.dest).toBe("temp/out");
      expect(options.destCreate).toBe(true);
      expect(options.template).toBe("css");
      expect(options.destTemplate).toBe("temp/templates");
      expect(options.templateClassName).toBe("icon");
      expect(options.templateFontName).toBe("icon-font");
      expect(options.templateFontPath).toBe("./fonts");
      expect(options.templateCacheString).toBe("cache");
      expect(options.verbose).toBe(true);
      expect(options.fontId).toBe("id");
      expect(options.fontStyle).toBe("italic");
      expect(options.fontWeight).toBe("700");
      expect(options.fixedWidth).toBe(true);
      expect(options.centerHorizontally).toBe(true);
      expect(options.normalize).toBe(true);
      expect(options.fontHeight).toBe("100");
      expect(options.round).toBe("1");
      expect(options.descent).toBe("5");
      expect(options.ascent).toBe("10");
      expect(options.startUnicode).toBe("0xea01");
      expect(options.prependUnicode).toBe(true);
      expect(options.metadata).toBe("meta");
      expect(options.sort).toBe(false);
      expect(options.ligatures).toBe(false);
      expect(options.unicodeRange).toBe(false);
      expect(options.addHashInFontUrl).toBe(true);
      expect(options.configFile).toContain("webfont.config.js");
    });
  });
});
