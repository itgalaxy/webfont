import cli from "./meow";
import {execCLI} from "../lib/execCLI";
import fs from "fs";
import rimraf from "rimraf";

const timeout = 10000;
jest.mock("./meow");
jest.setTimeout(timeout);

const destination = "temp/cli";
const fixturesGlob = "src/fixtures";
const source = `${fixturesGlob}/svg-icons`;

describe("cli", () => {

  beforeAll(() => new Promise((resolve, reject) => {

    fs.mkdir(destination, {recursive: true}, (err) => {

      if (err) {

        return reject(err);

      }

      return resolve(err);

    });

  }));


  beforeEach(() => new Promise((resolve, reject) => {

    rimraf(`${destination}/*`, (err) => {

      if (err) {

        return reject(err);

      }

      return fs.readdir(destination, (fileReadError, files) => {

        if (files.length !== 0) {

          throw new Error(`${destination} did not empty before the test.`);

        }

        resolve(fileReadError);

      });

    });

  }));

  it("exits with code 2 and displays --help if no argument parameters are passed", async () => {

    const output = await execCLI();

    expect(output.code).toBe(2);
    expect(output.stdout).toBe(cli.showHelp());
    expect(output.stderr).toBe("");

  });

  it("can show help", async () => {

    const output = await execCLI("--help");

    expect(output.code).toBe(2);
    expect(output.stdout).toBe(cli.showHelp());
    expect(output.stderr).toBe("");

  });

  it("can show version with --version", async () => {

    const output = await execCLI("--version");

    expect(output.code).toBe(0);
    expect(output.stdout).toBe(cli.showVersion());
    expect(output.stderr).toBe("");

  });

  it("should throw error `files glob patterns specified did not match any files` if not found files", async () => {

    // eslint-disable-next-line max-len
    const output = await execCLI(`${fixturesGlob}/not-found-svg-icons/**/* -d ${destination}`);

    expect(output.code).toBe(1);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(output.stdout).toContain(cli.error());
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

    const output = await execCLI(`${source} -d ${destination} --formats ["woff2"]`);

    expect(output.files).toEqual([
      "webfont.hash",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");

  });

  it("should generate all fonts with build-in template", async (done) => {

    // eslint-disable-next-line max-len
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
    fs.readFile(`${destination}/webfont.css`, {encoding: "utf-8"}, (err, data) => {

      if (err) {

        done(err);

        return;

      }

      expect(data).toMatchSnapshot();
      done();

    });

  });

  it("should respect `template` options", async (done) => {

    // eslint-disable-next-line max-len
    const output = await execCLI(`${source} -d ${destination} --template css --templateClassName foo --templateCacheString test --templateFontPath test/path --templateFontName testname`);

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
    fs.readFile(`${destination}/webfont.css`, {encoding: "utf-8"}, (err, data) => {

      if (err) {

        done(err);

        return;

      }

      expect(data).toMatchSnapshot();
      done();

    });

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

  it("should respect `font` options", async (done) => {

    // eslint-disable-next-line max-len
    const output = await execCLI(`${source} -d ${destination} --fontId testId --fontStyle italic --fontWeight 500 --fontHeight 15`);

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
    fs.readFile(`${destination}/webfont.svg`, {encoding: "utf-8"}, (err, data) => {

      if (err) {

        done(err);

        return;

      }

      expect(data).toMatchSnapshot();
      done();

    });

  });

  it("can be verbose", async () => {

    // eslint-disable-next-line max-lines
    const output = await execCLI(`${source} -d ${destination} --verbose`);

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.hash",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(output.stdout).toBe(cli.verbose());
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");

  });


  it("should create dest directory if it does not exist and --dest-create flag is provided", async (done) => {
    const nonExistentDestination = `${destination}/that/does/not/exist`;
    const output = await execCLI(`${source} -d ${nonExistentDestination} --dest-create`);

    fs.access(nonExistentDestination, fs.constants.F_OK, (accessError) => {

      const destinationWasCreated = !accessError;

      expect(destinationWasCreated).toBe(true);
      fs.readdir(nonExistentDestination, { encoding: "utf-8" }, (readdirError, files) => {
        if (readdirError) {
          done(readdirError);

          return;
        }

        output.files = files.filter((file) => file !== "that");

        expect(output.files).toEqual(files);
        done();
      });
    });
  });

  it("should not create dest directory if it does not exist", async (done) => {
    const nonExistentDestination = `${destination}/that/does/not/exist`;

    await execCLI(`${source} -d ${nonExistentDestination}`);

    fs.access(nonExistentDestination, fs.constants.F_OK, (accessError) => {

      const destinationWasCreated = !accessError;

      expect(destinationWasCreated).toBe(false);
      fs.readdir(nonExistentDestination, { encoding: "utf-8" }, (readdirError) => {
        expect(readdirError.message).toContain("ENOENT: no such file or directory, scandir");

        done();
      });
    });
  });

});
