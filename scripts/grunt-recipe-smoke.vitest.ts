import { execFile } from "node:child_process";
import { access, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const REPO_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const RECIPE_DIR = join(REPO_ROOT, "packages/grunt-webfont-recipe");
const OUTPUT_DIR = join(RECIPE_DIR, "dist/fonts");
const WOFF2_OUTPUT = join(OUTPUT_DIR, "icons.woff2");
const CSS_OUTPUT = join(OUTPUT_DIR, "icons.css");

const runNpm = (args: string[], cwd: string) =>
  execFileAsync("npm", args, {
    cwd,
    env: { ...process.env, npm_config_loglevel: "error" },
  });

describe("grunt-webfont recipe smoke", () => {
  it("should generate woff2 and css when grunt runs the custom webfont task", async () => {
    await runNpm(["install", "--no-fund", "--no-audit"], RECIPE_DIR);
    await runNpm(["run", "build", "-w", "webfont"], REPO_ROOT);

    await rm(join(RECIPE_DIR, "dist"), { recursive: true, force: true });

    await execFileAsync("npx", ["grunt", "webfont", "--force"], {
      cwd: RECIPE_DIR,
      env: { ...process.env, npm_config_loglevel: "error" },
    });

    await expect(access(WOFF2_OUTPUT)).resolves.toBeUndefined();
    await expect(access(CSS_OUTPUT)).resolves.toBeUndefined();
  }, 120_000);
});
