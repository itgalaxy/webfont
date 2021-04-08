import type {Config} from "@jest/types";

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
  verbose: true,
};

export default config;
