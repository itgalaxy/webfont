import rimraf from "rimraf";
import fs from "fs";
const { exec } = require('child_process');

const fixturesSrcDir  = "./src/__tests__/fixtures";
const templatesOutDir = "./out/__tests__/templates";

beforeAll(async () => {
  rimraf.sync('./out');
});

afterAll(async () => {
  rimraf.sync('./out');
});

describe("cli", () => {
  beforeEach(async () => {
    rimraf.sync(templatesOutDir);
  });

  it("should generate output as defined in webfont-config.js", async (done) => {
    exec(
      `node dist/cli.js ${fixturesSrcDir}/svg-icons/**/* --config ${fixturesSrcDir}/configs/webfont-config.js`,
      (err) => {
        if (err) { throw new Error(err.message); }

        expect(fs.existsSync(`${templatesOutDir}/TestFont.css`)).toBe(true);
        expect(fs.readFileSync(`${templatesOutDir}/TestFont.css`)).toMatchSnapshot();
        expect(fs.existsSync(`${templatesOutDir}/template.css`)).toBe(true);
        expect(fs.readFileSync(`${templatesOutDir}/template.css`)).toMatchSnapshot();

        done();
      }
    );
  });
});

