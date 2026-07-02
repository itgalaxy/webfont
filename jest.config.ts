import type {Config} from "@jest/types";

const esmNodeModules = "p-limit|svgicons2svgfont|svg-pathdata|transformation-matrix|yerror|yocto-queue";

const config: Config.InitialOptions = {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["json"],
  displayName: "Webfont",
  modulePathIgnorePatterns: [
    "<rootDir>/.github",
    "<rootDir>/.husky",
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
  transformIgnorePatterns: [`/node_modules/(?!${esmNodeModules}/)`],
  verbose: true,
};

export default config;
