import fs from "fs";
import * as fsPromise from "fs/promises";
import path from "path";
import rimraf from "rimraf";
import { execCLI } from "../lib/execCLI";
import meowMock from "./meow/__mocks__/index";

const timeout = 10000;
jest.mock("./meow");
jest.setTimeout(timeout);

const destination = "temp/cli";
const fixturesGlob = "src/fixtures";
const source = `${fixturesGlob}/svg-icons`;
const configPackageLink = path.join("node_modules", "webfont-fixture-config");
const configPackageSource = path.resolve(fixturesGlob, "config-package");

const rimrafAsync = (pattern: string) =>
  new Promise<void>((resolve, reject) => {
    rimraf(pattern, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });

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
    await rimrafAsync(`${destination}/*`);

    const files = await fsPromise.readdir(destination);

    if (files.length !== 0) {
      throw new Error(`${destination} did not empty before the test.`);
    }
  });

  it("exits with code 2 and displays --help if no argument parameters are passed", async () => {
    const output = await execCLI();

    expect(output.code).toBe(2);
    expect(output.stdout).toBe(meowMock.showHelp());
    expect(output.stderr).toBe("");
  });

  it("can show help", async () => {
    const output = await execCLI("--help");

    expect(output.code).toBe(2);
    expect(output.stdout).toBe(meowMock.showHelp());
    expect(output.stderr).toBe("");
  });

  it("can show version with --version", async () => {
    const output = await execCLI("--version");

    expect(output.code).toBe(0);
    expect(output.stdout).toBe(meowMock.showVersion());
    expect(output.stderr).toBe("");
  });

  describe("short options", () => {
    it("can show help with -h", async () => {
      const output = await execCLI("-h");

      expect(output.code).toBe(2);
      expect(output.stdout).toBe(meowMock.showHelp());
      expect(output.stderr).toBe("");
    });

    it("can show version with -v", async () => {
      const output = await execCLI("-v");

      expect(output.code).toBe(0);
      expect(output.stdout).toBe(meowMock.showVersion());
      expect(output.stderr).toBe("");
    });

    it("can set destination with -d", async () => {
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

    it("can create destination with -m", async () => {
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

    it("can set destTemplate with -s", async () => {
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

    it("can set font name with -u", async () => {
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

    it("can set formats with -f", async () => {
      const output = await execCLI(`${source} -d ${destination} -f '["woff2"]'`);

      expect(output.files).toEqual(["webfont.hash", "webfont.woff2"]);
      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");
    });

    it("can set template with -t", async () => {
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

    it("can set templateClassName with -c", async () => {
      const output = await execCLI(
        `${source} -d ${destination} -t css -c short-option-class --templateCacheString test`,
      );

      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");

      const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
      expect(css).toContain(".short-option-class");
    });

    it("can set templateFontName with -n", async () => {
      const output = await execCLI(
        `${source} -d ${destination} -t css -n short-option-font --templateCacheString test`,
      );

      expect(output.code).toBe(0);
      expect(output.stderr).toBe("");

      const css = await fsPromise.readFile(`${destination}/webfont.css`, { encoding: "utf-8" });
      expect(css).toContain("short-option-font");
    });

    it("can set templateFontPath with -p", async () => {
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
    expect(output.stdout).toContain(meowMock.error());
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

  it("should generate built-in html template", async () => {
    const output = await execCLI(`${source} -d ${destination} --template html --templateCacheString test`);

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

  it("can set font name", async () => {
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

  it("can be verbose", async () => {
    const output = await execCLI(`${source} -d ${destination} --verbose`);

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.hash",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.stdout).toBe(meowMock.verbose());
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should create dest directory if it does not exist and --dest-create flag is provided", async () => {
    const nonExistentDestination = `${destination}/that/does/not/exist`;
    const output = await execCLI(`${source} -d ${nonExistentDestination} --dest-create`);

    await fsPromise.access(nonExistentDestination, fs.constants.F_OK);

    const files = await fsPromise.readdir(nonExistentDestination, { encoding: "utf-8" });

    output.files = files.filter((file) => file !== "that");

    expect(output.files).toEqual(files);
  });

  it("should not create dest directory if it does not exist", async () => {
    const nonExistentDestination = `${destination}/that/does/not/exist`;

    await execCLI(`${source} -d ${nonExistentDestination}`);

    let destinationWasCreated = true;
    try {
      await fsPromise.access(nonExistentDestination, fs.constants.F_OK);
    } catch (_exception) {
      destinationWasCreated = false;
    }
    expect(destinationWasCreated).toBe(false);

    let error: Record<string, unknown> = {};
    try {
      await fsPromise.readdir(nonExistentDestination, { encoding: "utf-8" });
    } catch (readdirError) {
      error = readdirError;
    }
    expect(error.message).toContain("ENOENT: no such file or directory, scandir");
  });
});
