import {ExecException, exec} from "child_process";
import fs from "fs";

export type Output = {
  code?: number;
  error: ExecException | null;
  files: string[];
  stderr?: string;
  stdout?: string;
}

// eslint-disable-next-line no-unused-vars
export type ExecCLI = (args?: string, destination?: string) => Promise<Output>;

/**
 * @name execCLI
 * @description Execute webfont CLI commands using child_process.
 *
 * @param {String} args - Arguments to pass to the CLI.
 * @param {String} destination - Path to read/write files
 * @return {Promise.<Object>} - Contains CLI error, stdout, stderr data.
 * @example
 *
 * execCLI("--help").then((output) => {
 *  console.log(output.stdout) // => Outputs usage information.
 * })
 *
 */
export const execCLI : ExecCLI = (
  args = "",
  destination = "temp/cli",
) => new Promise((resolve, reject) => {
  const command = `node dist/cli.js ${args}`;

  exec(command, {encoding: "utf-8"}, (error, stdout, stderr) => {
    fs.readdir(destination, {encoding: "utf-8"}, (err, files: string[]) => {
      if (err) {
        reject(err);
        throw err;
      }

      let outputCode = 0;
      if (error && error.code) {
        outputCode = error.code;
      }

      const output : Output = {
        code: outputCode,
        error,
        files,
        stderr,

        /**
         * Remove new line created by console.log;
         */
        stdout: stdout.replace(/\n$/u, ""),
      };

      resolve(output);
    });
  });
});
