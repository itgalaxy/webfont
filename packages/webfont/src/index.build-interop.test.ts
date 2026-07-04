import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const esmPath = path.resolve(__dirname, "..", "dist", "index.mjs");
const cjsPath = path.resolve(__dirname, "..", "dist", "index.js");

describe("build interop (issue #618)", () => {
  it("should expose webfont as a callable default export from the ESM build", () => {
    const result = execFileSync("node", [
      "--input-type=module",
      "-e",
      `import m, { webfont as named } from ${JSON.stringify(esmPath)}; console.log(JSON.stringify({ default: typeof m, named: typeof named }));`,
    ]).toString();
    const parsed = JSON.parse(result);
    expect(parsed.default).toBe("function");
    expect(parsed.named).toBe("function");
  });

  it("should keep named exports on the CJS build for require()", () => {
    const require = createRequire(import.meta.url);
    const cjs = require(cjsPath);
    expect(typeof cjs.webfont).toBe("function");
    expect(typeof cjs.default).toBe("function");
  });

  it("should render a built-in template from the ESM build without __dirname errors", () => {
    const svgGlob = path.resolve(__dirname, "fixtures/svg-icons/*.svg");
    const result = execFileSync("node", [
      "--input-type=module",
      "-e",
      `import webfont from ${JSON.stringify(esmPath)}; const r = await webfont({ files: ${JSON.stringify(svgGlob)}, formats: ["woff2"], template: "css" }); console.log(typeof r.template === "string" && r.template.length > 0 ? "ok" : "fail");`,
    ]).toString();
    expect(result.trim()).toBe("ok");
  });
});
