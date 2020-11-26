import fs from "fs";
import path from "path";
import cli from "../cli";
import rimraf from "rimraf";
import { exec } from "child_process";

jest.mock("../cli");
jest.setTimeout(10000);

const fixturesGlob = "src/__tests__/fixtures";
const sourceDir = `${fixturesGlob}/svg-icons`;
const tempDir = "temp";
const destDir = `${tempDir}/cli`;

/**
 * @name execCLI
 * @description Excecute webfont CLI commands using child_process.
 *
 * @param {String} args - Arguments to pass to the CLI.
 * @return {Promise.<Object>} - Contains CLI error, stdout, stderr data.
 * @example
 *
 * execCLI("--help").then((ouput) => {
 *  console.log(output.stdout) // => Outputs usage information.
 * })
 *
 */
function execCLI(args = "") {
  return new Promise((resolve) => {
    exec(
      `node -r esm src/cli.js ${args}`,
      { encoding: "utf-8" },
      (error, stdout, stderr) => {
        fs.readdir(destDir, { encoding: "utf-8" }, (err, files) => {
          if (err) {
            throw err;
          }

          resolve({
            files,
            error,
            stdout: stdout.replace(/\n$/, ""), // Remove new line created by console.log();,
            stderr,
            code: error && error.code ? error.code : 0,
          });
        });
      }
    );
  });
}

describe("cli", () => {
  /* eslint-disable jest/no-done-callback */
  beforeAll((done) => {
    fs.mkdir(destDir, { recursive: true }, (err) => {
      done(err);
    });
  });

  beforeEach((done) => {
    rimraf(`${destDir}/*`, (err) => {
      if (err) {
        done(err);

        return;
      }

      /* eslint-disable-next-line no-shadow */
      fs.readdir(destDir, (err, files) => {
        if (files.length !== 0) {
          throw new Error(`${destDir} did not empty before the test.`);
        }

        done(err);
      });
    });
  });

  afterAll((done) => {
    fs.rmdir(tempDir, { recursive: true }, (err) => { done(err); })
  });

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
    const output = await execCLI(
      `${fixturesGlob}/not-found-svg-icons/**/* -d ${destDir}`
    );

    expect(output.code).toBe(1);
    expect(output.stdout).toContain(cli.error());
    expect(output.stderr).toBe("");
  });

  it("should generate all fonts", async () => {
    const output = await execCLI(`${sourceDir} -d ${destDir}`);

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
    const output = await execCLI(
      `${sourceDir} -d ${destDir} --formats ["woff2"]`
    );

    expect(output.files).toEqual([
      "webfont.hash",
      "webfont.woff2",
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });

  it("should generate all fonts with build-in template", async (done) => {
    const output = await execCLI(
      `${sourceDir} -d ${destDir} --template css --template-cache-string test --verbose`
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
    fs.readFile(
      `${destDir}/webfont.css`,
      { encoding: "utf-8" },
      (err, data) => {
        if (err) {
          done(err);

          return;
        }

        expect(data).toMatchSnapshot();
        done();
      }
    );
  });

  it("should process multiple (built-in) templates", async (done) => {
    const output = await execCLI(
      `${sourceDir} -d ${destDir} --formats "svg woff2" -t "css html" -t "./templates/template.styl.njk" --template-cache-string test`
    );

    expect(output.files).toEqual([
      "template.styl",
      "webfont.css",
      "webfont.html",
      "webfont.svg",
      "webfont.woff2"
    ]);
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");

    done();
  });

  it("should respect `template` options", async (done) => {
    const output = await execCLI(
      `${sourceDir} -d ${destDir} --template css --template-class-name foo --template-cache-string test --template-font-path test/path --template-font-name testname`
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
    fs.readFile(
      `${destDir}/webfont.css`,
      { encoding: "utf-8" },
      (err, data) => {
        if (err) {
          done(err);

          return;
        }

        expect(data).toMatchSnapshot();
        done();
      }
    );
  });

  it("can set font name", async () => {
    const output = await execCLI(
      `${sourceDir} -d ${destDir} --font-name foobar`
    );

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
    const output = await execCLI(
      `${sourceDir} -d ${destDir} --font-id testId --font-style italic --font-weight 500 --font-height 15`
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
    fs.readFile(
      `${destDir}/webfont.svg`,
      { encoding: "utf-8" },
      (err, data) => {
        if (err) {
          done(err);

          return;
        }

        expect(data).toMatchSnapshot();
        done();
      }
    );
  });
  it("can be verbose", async () => {
    const output = await execCLI(`${sourceDir} -d ${destDir} --verbose`);

    expect(output.files).toEqual([
      "webfont.eot",
      "webfont.hash",
      "webfont.svg",
      "webfont.ttf",
      "webfont.woff",
      "webfont.woff2",
    ]);
    expect(output.stdout).toBe(cli.verbose(path.resolve(destDir) + path.sep));
    expect(output.code).toBe(0);
    expect(output.stderr).toBe("");
  });
});
