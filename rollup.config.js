import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { dependencies } from "./package.json";

const dir = "dist";

const external = [...Object.keys(dependencies), "crypto", "fs", "os", "path", "stream", "util"];

const plugins = [
  typescript({
    exclude: ["src/**/*.test.ts", "jest/**"],
  }),
  commonjs(),
];

module.exports = [
  {
    external,
    input: "src/cli/index.ts",
    output: {
      banner: "#!/usr/bin/env node\n",
      file: `${dir}/cli.js`,
      format: "cjs",
    },
    plugins,
  },
  {
    external,
    input: "src/index.ts",
    output: {
      dir,
      exports: "named",
      format: "cjs",
    },
    plugins,
  },
];
