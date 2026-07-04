import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webfontCliHelpText } from "./cliHelpText.mjs";

const REPO_ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../../");
const README_PATH = resolve(REPO_ROOT, "README.md");

const BEGIN = "<!-- cli-help:begin -->";
const END = "<!-- cli-help:end -->";

describe("CLI help text", () => {
  it("should keep README CLI Usage block aligned with cliHelpText.ts", () => {
    const readme = readFileSync(README_PATH, "utf8");
    const pattern = new RegExp(`${BEGIN}[\\s\\S]*?\`\`\`shell([\\s\\S]*?)\`\`\`[\\s\\S]*?${END}`, "u");
    const match = readme.match(pattern);

    expect(match).not.toBeNull();
    expect(match?.[1]?.trim()).toBe(webfontCliHelpText.trim());
  });
});
