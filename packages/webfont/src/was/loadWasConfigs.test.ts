import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadWasConfigs } from "./loadWasConfigs";

const writeWasFixture = async (dir: string, name: string, contents: string): Promise<string> => {
  const configPath = join(dir, name);
  await writeFile(configPath, contents, "utf8");
  return configPath;
};

describe("loadWasConfigs", () => {
  it("should load a single .was object from disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webfont-was-"));
    try {
      const configPath = await writeWasFixture(
        dir,
        "single.was",
        JSON.stringify({
          dest: "dist/fonts",
          files: "icons/*.svg",
          formats: ["woff2"],
          name: "MyFont",
          template: "css",
        }),
      );

      const configs = await loadWasConfigs(configPath);

      expect(configs).toHaveLength(1);
      expect(configs[0]?.name).toBe("MyFont");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should load an array of .was objects from disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webfont-was-"));
    try {
      const configPath = await writeWasFixture(
        dir,
        "batch.was",
        JSON.stringify([
          {
            dest: "dist/fonts",
            files: "icons/*.svg",
            formats: ["woff2"],
            name: "First",
            template: "css",
          },
          {
            dest: "dist/fonts",
            files: "icons/*.svg",
            formats: ["ttf"],
            name: "Second",
            template: "scss",
          },
        ]),
      );

      const configs = await loadWasConfigs(configPath);

      expect(configs).toHaveLength(2);
      expect(configs.map((config) => config.name)).toEqual(["First", "Second"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should reject malformed .was files with helpful configPath errors", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webfont-was-"));
    try {
      const nullRoot = await writeWasFixture(dir, "null-root.was", "null");
      await expect(loadWasConfigs(nullRoot)).rejects.toThrow(
        `Invalid .was config root value in ${nullRoot}: expected an object`,
      );

      const broken = await writeWasFixture(dir, "broken.was", "{ not-json");
      await expect(loadWasConfigs(broken)).rejects.toThrow(`Invalid JSON in .was config ${broken}:`);

      const missingDest = await writeWasFixture(
        dir,
        "missing-dest.was",
        JSON.stringify({
          dest: "",
          files: "icons/*.svg",
          formats: ["woff2"],
          name: "MyFont",
          template: "css",
        }),
      );
      await expect(loadWasConfigs(missingDest)).rejects.toThrow(
        `Invalid .was config root value in ${missingDest}: "dest" must be a non-empty string`,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
