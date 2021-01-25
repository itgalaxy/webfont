const { dependencies } = require("./package.json");

const external = [
  ...Object.keys(dependencies),
  "crypto",
  "fs",
  "path",
  "stream",
  "svgicons2svgfont/src/filesorter",
  "svgicons2svgfont/src/metadata",
];

const dir = "dist/rollup";

module.exports = [
  {
    external,
    input: ["src/cli.js"],
    output: {
      banner: "#!/usr/bin/env node\n",
      dir,
      exports: "auto",
      format: "cjs",
      preserveModules: false,
    },
  },
  {
    external,
    input: "src/index.js",
    output: {
      dir,
      exports: "named",
      format: "cjs",
      preserveModules: true,
    },
  },
];
