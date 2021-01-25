const ignorePatterns = ["/.github/", "/demo/", "/dist/", "/node_modules/"];

export default {
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ignorePatterns,
  coverageReporters: [ "json" ],
  testEnvironment: "node",
  testPathIgnorePatterns: ignorePatterns,
  verbose: true
};
