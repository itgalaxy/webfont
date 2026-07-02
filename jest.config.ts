import type { Config } from "@jest/types";

const esmNodeModules = [
  "p-limit",
  "svgicons2svgfont",
  "svg-pathdata",
  "transformation-matrix",
  "yerror",
  "yocto-queue",
  "is-svg",
  "@file-type/xml",
  "strtok3",
  "peek-readable",
  "@tokenizer/token",
].join("|");

const config: Config.InitialOptions = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["json"],
  displayName: "Webfont",
  moduleNameMapper: {
    "^globby$": "<rootDir>/jest/globby-stub.ts",
    "^@file-type/xml$": "<rootDir>/node_modules/@file-type/xml/lib/index.js",
  },
  modulePathIgnorePatterns: [
    "<rootDir>/.github",
    "<rootDir>/coverage",
    "<rootDir>/dist",
    "<rootDir>/node_modules",
    "<rootDir>/temp",
  ],
  name: "webfont",

  /**
   * If test environment is not set to "node", you may receive an error message when testing `wawoff2` module.
   */
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
          },
          target: "es2020",
        },
        module: {
          type: "commonjs",
        },
      },
    ],
  },
  transformIgnorePatterns: [`/node_modules/(?!${esmNodeModules}/)`],
  verbose: true,
};

export default config;
