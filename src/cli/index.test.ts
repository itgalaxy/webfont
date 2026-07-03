import fs from "fs";
import * as fsPromise from "fs/promises";
import path from "path";
import { version } from "../../package.json";
import { execCLI } from "../lib/execCLI";
import { createMeowCli } from "./meow/createMeowCli";

const formatCliStdout = (value: string): string => value.replace(/\n$/u, "");
const expectedHelp = () => formatCliStdout(`${createMeowCli([]).help}\n`);
const expectedVersion = () => version;
const expectedVerbose = () => "Generating SVG font...";
const expectedGlobError = () => "Error: Files glob patterns specified did not match any supported files";

const destination = "temp/cli";
const fixturesGlob = "src/fixtures";
const source = `${fixturesGlob}/svg-icons`;
const configPackageLink = path.join("node_modules", "webfont-fixture-config");
const configPackageSource = path.resolve(fixturesGlob, "config-package");

const emptyDir = async (dir: string) => {
  await fsPromise.rm(dir, { force: true, recursive: true });
  await fsPromise.mkdir(dir, { recursive: true });
};

const isENOENT = (error: unknown): error is NodeJS.ErrnoException =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

describe("cli", () => {
  beforeAll(async () => {
    await fsPromise.mkdir(destination, { recursive: true });
    await fsPromise.mkdir(path.dirname(configPackageLink), { recursive: true });

    try {
      await fsPromise.lstat(configPackageLink);
    } catch (error) {
      if (!isENOENT(error)) {
        throw error;
      }

      await fsPromise.symlink(configPackageSource, configPackageLink, "dir");
    }
  });

  afterAll(async () => {
    try {
      const stat = await fsPromise.lstat(configPackageLink);

      if (stat.isSymbolicLink()) {
        await fsPromise.unlink(configPackageLink);
      }
    } catch (error) {
      if (!isENOENT(error)) {
        throw error;
      }
    }
  });

  beforeEach(async () => {
    await emptyDir(destination);

    const files = await fsPromise.readdir(destination);

    if (files.length !== 0) {
      throw new Error(`${destination} did not empty before the test.`);
    }
  });

  it("should exit with code 2 and displays --help if no argument parameters are passed", async () => {
    const output = await execCLI();

    expect(output.code).toBe(2);
    expect(output.stdout).toBe(expectedHelp());
    expect(output.stderr).toBe("");
  });

  it("should show help", async () => {
    const output = await execCLI("--help");

    expect(output.code).toBe(2);
    expect(output.stdout).toBe(expectedHelp());
    expect(output.stderr).toBe("");
  });

  it("should show version with --version", async () => {
    const output = await execCLI("--version");

    expect(output.code).toBe(0);
    expect(output.stdout).toBe(expectedVersion());
    expect(output.stderr).toBe("");
  });

  describe("short options", () => {
    it("should show help with -h", async () => {
      const output = await execCLI("-h");

      expect(output.code).toBe(2);
      expect(output.stdout).toBe(expectedHelp());
      expect(output.stderr).toBe("");
    });

    it("should show version with -v", async () => {
      const output = await execCLI("-v");

      expect(output.code).toBe(0);
      expect(output.stdout).toBe(expectedVersion());
      expect(output.stderr).toBe("");
    });

    it("should set destination with -d", async () => {
      const output = await execCLI(`${source} -d ${destination}`);

      expect(output.files).toEqual([
        "webfont.eot",
        "webfont.hash",
        "webfont.svg",
        "webfont.ttf",
        "webfont.woff",
        "webfont.woff2",
      ]);
      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");
    });

    it("should create destination with -m", async () => {
      const nonExistentDestination = `${destination}/short-option/missing-dest`;
      const output = await execCLI(`${source} -d ${nonExistentDestination} -m`);

      await fsPromise.access(nonExistentDestination, fs.constants.F_OK);

      const files = await fsPromise.readdir(nonExistentDestination, { encoding: "utf-8" });

      expect(files).toEqual(
        expect.arrayContaining(["webfont.eot", "webfont.svg", "webfont.ttf", "webfont.woff", "webfont.woff2"]),
      );
      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");
    });

    it("should set destTemplate with -s", async () => {
      const templateDest = `${destination}/template-output`;
      await fsPromise.mkdir(templateDest, { recursive: true });

      const output = await execCLI(
        `${source} -d ${destination} -t css --templateCacheString test -s ${templateDest}`,
      );

      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");

      const cssPath = `${templateDest}/webfont.css`;
      await fsPromise.access(cssPath, fs.constants.F_OK);
      const css = await fsPromise.readFile(cssPath, { encoding: "utf-8" });
      expect(css).toMatchSnapshot();
    });

    it("should set font name with -u", async () => {
      const output = await execCLI(`${source} -d ${destination} -u foobar`);

      expect(output.files).toEqual([
        "foobar.eot",
        "foobar.hash",
        "foobar.svg",
        "foobar.ttf",
        "foobar.woff",
        "foobar.woff2",
      ]);
      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");
    });

    it("should set formats with -f", async () => {
      const output = await execCLI(`${source} -d ${destination} -f '["woff2"]'`);

      expect(output.files).toEqual(["webfont.hash", "webfont.woff2"]);
      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");
    });

    it("should reject unknown format names on the CLI (#133)", async () => {
      const output = await execCLI(`${source} -d ${destination} -f icon`);

      expect(output.code).toBe(1);
      expect(output.stderr).toBe("");
      expect(output.stdout).toContain('Invalid format "icon"');
    });

    it("should set template with -t", async () => {
      const output = await execCLI(`${source} -d ${destination} -t css --templateCacheString test`);

      expect(output.files).toEqual([
        "webfont.css",
        "webfont.eot",
        "webfont.svg",
        "webfont.ttf",
        "webfont.woff",
        "webfont.woff2",
      ]);
      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");
    });

    it("should set templateClassName with -c", async () => {
      const output = await execCLI(
        `${source} -d ${destination} -t css -c short-option-class --templateCacheString test`,
      );

      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");

      const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
      expect(css).toContain(".short-option-class");
    });

    it("should set templateFontName with -n", async () => {
      const output = await execCLI(
        `${source} -d ${destination} -t css -n short-option-font --templateCacheString test`,
      );

      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");

      const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
      expect(css).toContain("short-option-font");
    });

    it("should set templateFontPath with -p", async () => {
      const output = await execCLI(`${source} -d ${destination} -t css -p short/path --templateCacheString test`);

      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");

      const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
      expect(css).toContain("short/path/");
    });
  });

  it("should throw error `files glob patterns specified did not match any files` if not found files", async () => {
    const output = await execCLI(`${fixturesGlob}/not-found-svg-icons/**/* -d ${destination}`);

    expect(output.code).toBe(1);
    expect(output.stdout).toContain(expectedGlobError());
    expect(output.stderr).toBe("");
  });

  it("should generate all fonts", async () => {
    const output = await execCLI(`${source} -d ${destination}`);

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.hash",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should generate only `woff2` font", async () => {
    const output = await execCLI(`${source} -d ${destination} -f '["woff2"]'`);

    expect(output.files).toEqual(["webfont.hash", "webfont.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should generate all fonts with build-in template", async () => {
    const output = await execCLI(`${source} -d ${destination} --template css --templateCacheString test`);

    expect(output.files).toEqual([
      "webfont.css",
      "webfont.eot",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const data = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
    expect(data).toMatchSnapshot();
  });

  it("should generate multiple built-in templates (#158)", async () => {
    const output = await execCLI(`${source} -d ${destination} -t '["html","scss"]' --templateCacheString test`);

    expect(output.files).toEqual(
      expect.arrayContaining(["webfont.html", "webfont.scss", "webfont.woff2", "webfont.woff", "webfont.ttf"]),
    );
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");

    const html = await fsPromise.readFile(`${destination}/webfont.html`, { encoding: "utf-8" });
    const scss = await fsPromise.readFile(`${destination}/webfont.scss`, { encoding: "utf-8" });
    expect(html).toContain("<!doctype html>");
    expect(scss).toContain("$webfont-");
  });

  it("should respect `template` options", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --template css --templateClassName foo --templateCacheString test --templateFontPath test/path --templateFontName testname`,
    );

    expect(output.files).toEqual([
      "webfont.css",
      "webfont.eot",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const data = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
    expect(data).toMatchSnapshot();
  });

  it("should load config via --config with a relative path", async () => {
    const configPath = `${fixturesGlob}/configs/.webfontrc-cli.json`;
    const output = await execCLI(`${source} -d ${destination} --config ${configPath}`);

    expect(output.files).toEqual(["cli-config-font.hash", "cli-config-font.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should load a JavaScript config via --config (#480)", async () => {
    const configPath = `${fixturesGlob}/configs/webfont.config-cli.js`;
    const output = await execCLI(`${source} -d ${destination} --config ${configPath}`);

    expect(output.files).toEqual(["cli-config-js-font.hash", "cli-config-js-font.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should load config via --config with an absolute path", async () => {
    const configPath = path.resolve(fixturesGlob, "configs/.webfontrc-cli.json");
    const output = await execCLI(`${source} -d ${destination} --config ${configPath}`);

    expect(output.files).toEqual(["cli-config-font.hash", "cli-config-font.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should load config via --config with a node_modules package name", async () => {
    const output = await execCLI(`${source} -d ${destination} --config webfont-fixture-config`);

    expect(output.files).toEqual(["config-node-module.hash", "config-node-module.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should use files from config when no CLI input is provided (#2)", async () => {
    const configPath = `${fixturesGlob}/configs/.webfontrc-files.json`;
    const output = await execCLI(`-d ${destination} --config ${configPath}`);

    expect(output.files).toEqual(["config-files-font.hash", "config-files-font.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should reject CLI input when config defines files (#2)", async () => {
    const configPath = `${fixturesGlob}/configs/.webfontrc-files.json`;
    const output = await execCLI(`${source}/envelope.svg -d ${destination} --config ${configPath}`);

    expect(output.code).toBe(1);
    expect(output.stderr).toBe("");
    expect(output.stdout).toMatch(
      /Cannot specify input files on the command line when `files` is set in the config file/u,
    );
  });

  it("should generate built-in html template", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --template html --templateCacheString test --ligatures`,
    );

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.html",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const data = await fsPromise.readFile(`${destination}/webfont.html`, { encoding: "utf-8" });
    expect(data).toContain("<!doctype html>");
    expect(data).toMatchSnapshot();
  });

  it("should include font hash in template when addHashInFontUrl is enabled", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --template css --templateCacheString test --addHashInFontUrl`,
    );

    expect(output.files).toEqual([
      "webfont.css",
      "webfont.eot",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
    expect(css).toMatch(/&v=[a-f0-9]{32}/u);
    expect(css).toMatchSnapshot();
  });

  it("should include font hash in scss template when addHashInFontUrl is enabled (#125)", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --template scss --templateCacheString test --addHashInFontUrl`,
    );

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.scss",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const scss = await fsPromise.readFile(`${destination}/webfont.scss`, { encoding: "utf-8" });
    expect(scss).toMatch(/&v=[a-f0-9]{32}/u);
    expect(scss).toContain('url("./webfont.woff2?');
  });

  it("should omit unicode-range in css template by default", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --template css --templateCacheString test --formats woff2`,
    );

    expect(output.files).toEqual(["webfont.css", "webfont.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
    expect(css).not.toContain("unicode-range:");
  });

  it("should include unicode-range when --unicode-range is passed (#322)", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --template css --templateCacheString test --formats woff2 --unicode-range`,
    );

    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
    expect(css).toContain("unicode-range: U+EA01-EA03;");
  });

  it("should set font name", async () => {
    const output = await execCLI(`${source} -d ${destination} --fontName foobar`);

    expect(output.files).toEqual([
      "foobar.eot",
      "foobar.hash",
      "foobar.svg",
      "foobar.ttf",
      "foobar.woff",
      "foobar.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should respect `font` options", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --fontId testId --fontStyle italic --fontWeight 500 --fontHeight 15`,
    );

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.hash",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    const data = await fsPromise.readFile(`${destination}/webfont.svg`, { encoding: "utf-8" });
    expect(data).toMatchSnapshot();
  });

  it("should run in verbose mode", async () => {
    const output = await execCLI(`${source} -d ${destination} --verbose`);

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.hash",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.stdout).toBe(expectedVerbose());
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should warn about evenodd fill-rule on stdout when verbose (#175)", async () => {
    const output = await execCLI(`${fixturesGlob}/svg-evenodd/linkedin.svg -d ${destination} --verbose -f svg`);

    expect(output.stdout).toContain("fill-rule: evenodd");
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should log stroke-only diagnostics on stdout when --svg-diagnose is enabled", async () => {
    const output = await execCLI(
      `${fixturesGlob}/svg-stroke-icons/stroked-plus.svg -d ${destination} --svg-diagnose -f ttf`,
    );

    expect(output.stdout).toContain("stroke-based paths");
    expect(output.stdout).toContain("Empty glyph path");
    expect(output.code).toBe(1);
    expect(output.stderr).toBe("");
  });

  it("should fail when stroke-only SVGs produce empty glyph paths (#327)", async () => {
    const output = await execCLI(`${fixturesGlob}/svg-icons-stroke-only/wave.svg -d ${destination} -f woff2`);

    expect(output.code).toBe(1);
    expect(output.stderr).toBe("");
    expect(output.stdout).toContain("Empty glyph path");
    expect(output.stdout).toContain("wave.svg");
  });

  it("should optimize messy SVGs when --optimize-svg is enabled (#724)", async () => {
    const output = await execCLI(
      `${fixturesGlob}/svg-icons-messy/triangle.svg -d ${destination} -f woff2 --optimize-svg`,
    );

    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    expect(output.files).toEqual(["webfont.hash", "webfont.woff2"]);
  });

  it("should create dest directory if it does not exist and --dest-create flag is provided", async () => {
    const nonExistentDestination = `${destination}/that/does/not/exist`;
    const output = await execCLI(`${source} -d ${nonExistentDestination} --dest-create`);

    await fsPromise.access(nonExistentDestination, fs.constants.F_OK);

    const files = await fsPromise.readdir(nonExistentDestination, { encoding: "utf-8" });

    output.files = files.filter((file) => file !== "that");

    expect(output.files).toEqual(files);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should not create dest directory if it does not exist", async () => {
    const nonExistentDestination = `${destination}/that/does/not/exist`;

    const output = await execCLI(`${source} -d ${nonExistentDestination}`);

    expect(output.code).toBe(1);
    expect(output.stdout).toContain("Destination directory");
    expect(output.stdout).toContain(nonExistentDestination);
    expect(output.stdout).toContain("does not exist");
    expect(output.stdout).toContain("--dest-create");
    expect(output.stderr).toBe("");

    let destinationWasCreated = true;
    try {
      await fsPromise.access(nonExistentDestination, fs.constants.F_OK);
    } catch (_exception) {
      destinationWasCreated = false;
    }
    expect(destinationWasCreated).toBe(false);
  });

  it("should fail with a clear error when dest does not exist and verbose is enabled", async () => {
    const nonExistentDestination = `${destination}/verbose/missing/dest`;

    const output = await execCLI(`${source} -d ${nonExistentDestination} --verbose`);

    expect(output.code).toBe(1);
    expect(output.stdout).toContain("Generating SVG font...");
    expect(output.stdout).toContain("Destination directory");
    expect(output.stdout).toContain(nonExistentDestination);
    expect(output.stdout).toContain("does not exist");
    expect(output.stdout).toContain("--dest-create");
    expect(output.stderr).toBe("");

    let destinationWasCreated = true;
    try {
      await fsPromise.access(nonExistentDestination, fs.constants.F_OK);
    } catch {
      destinationWasCreated = false;
    }
    expect(destinationWasCreated).toBe(false);
  });

  it("should generate only `woff2` font from comma-separated formats", async () => {
    const output = await execCLI(`${source} -d ${destination} -f woff2`);

    expect(output.files).toEqual(["webfont.hash", "webfont.woff2"]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should honor --no-sort flag (ligatures off by default)", async () => {
    const output = await execCLI(`${source} -d ${destination} --no-sort`);

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.hash",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should respect svgicons2svgfont flags passed on the CLI", async () => {
    const output = await execCLI(
      `${source} -d ${destination} --normalize --centerHorizontally --centerVertically --fixedWidth --fontWeight 500 --metadata test-meta`,
    );

    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    expect(output.files).toEqual(
      expect.arrayContaining(["webfont.eot", "webfont.svg", "webfont.ttf", "webfont.woff", "webfont.woff2"]),
    );

    const svg = await fsPromise.readFile(`${destination}/webfont.svg`, { encoding: "utf-8" });
    expect(svg).toContain('font-weight="500"');
    expect(svg).toContain("<metadata>test-meta</metadata>");
  });

  it("should convert woff2 input to ttf output via the CLI", async () => {
    const conversionDest = "temp/cli-woff2-conversion";
    const output = await execCLI(
      `src/fixtures/fonts/iconfont.woff2 -d ${conversionDest} -f ttf -u iconfont --dest-create`,
      conversionDest,
    );

    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    expect(output.files).toEqual(["iconfont.ttf"]);

    const ttf = await fsPromise.readFile(`${conversionDest}/iconfont.ttf`);
    expect(ttf.length).toBeGreaterThan(0);
  });

  it("should batch-decompress multiple webfont files via the CLI", async () => {
    const conversionDest = "temp/cli-batch-decompress";
    const output = await execCLI(
      `src/fixtures/fonts/iconfont.woff src/fixtures/fonts/iconfont.woff2 -d ${conversionDest} -f ttf --dest-create`,
      conversionDest,
    );

    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    expect(output.files).toEqual(expect.arrayContaining(["iconfont-woff.ttf", "iconfont-woff2.ttf"]));
  });

  it("should encode ttf input to woff and woff2 via the CLI", async () => {
    const conversionDest = "temp/cli-ttf-encode";
    const output = await execCLI(
      `src/fixtures/fonts/iconfont.ttf -d ${conversionDest} -f woff,woff2 -u iconfont --dest-create`,
      conversionDest,
    );

    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
    expect(output.files).toEqual(expect.arrayContaining(["iconfont.woff", "iconfont.woff2"]));

    const woff = await fsPromise.readFile(`${conversionDest}/iconfont.woff`);
    const woff2 = await fsPromise.readFile(`${conversionDest}/iconfont.woff2`);
    expect(woff.length).toBeGreaterThan(0);
    expect(woff2.length).toBeGreaterThan(0);
  });
});
