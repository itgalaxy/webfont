import cli from "../cli";
import { exec } from "child_process";

jest.mock("../cli");
jest.setTimeout(10000);

/**
 * @name webfontCLI
 * @description Excecute webfont CLI commands using child_process.
 *
 * @param {String} args - Arguments to pass to the CLI.
 * @return {Promise.<Object>} - Contains CLI error, stdout, stderr data.
 * @example
 *
 * webfontCLI("--help").then((ouput) => {
 *  console.log(output.stdout) // => Outputs usage information.
 * })
 *
 */
function webfontCLI(args = "") {
  return new Promise((resolve) => {
    exec(
      `node -r esm src/cli.js -- ${args}`,
      { encoding: "utf-8" },
      (error, stdout, stderr) => {
        resolve({
          error,
          stdout,
          stderr,
          code: error && error.code ? error.code : 0,
        });
      }
    );
  });
}

describe("cli", () => {
  it("exits with code 2 and displays --help if no argument parameters are passed", async () => {
    const output = await webfontCLI();

    expect(output.code).toBe(2);
    expect(output.stdout).toBe(cli.showHelp());
    expect(output.stderr).toBe("");
  });
});
