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

  it("should reject null or invalid entries with a helpful configPath error", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webfont-was-"));
    try {
      const nullRoot = await writeWasFixture(dir, "null-root.was", "null");
      await expect(loadWasConfigs(nullRoot)).rejects.toThrow(
        `Invalid .was config root value in ${nullRoot}: expected an object`,
      );

      const nullItem = await writeWasFixture(dir, "null-item.was", JSON.stringify([null]));
      await expect(loadWasConfigs(nullItem)).rejects.toThrow(
        `Invalid .was config at index 0 in ${nullItem}: expected an object`,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should wrap JSON.parse failures with the config path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webfont-was-"));
    try {
      const configPath = await writeWasFixture(dir, "broken.was", "{ not-json");

      await expect(loadWasConfigs(configPath)).rejects.toThrow(`Invalid JSON in .was config ${configPath}:`);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
