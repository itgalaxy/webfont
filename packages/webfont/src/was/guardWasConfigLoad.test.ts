import { describe, expect, it } from "vitest";
import { guardLoadedWasConfigs, parseWasConfigJson } from "./guardWasConfigLoad";

const validWas = {
  dest: "dist/fonts",
  files: "icons/*.svg",
  formats: ["woff2"],
  name: "MyFont",
  template: "css",
};

describe("parseWasConfigJson", () => {
  it("should wrap JSON.parse failures with the config path", () => {
    const configPath = "/tmp/broken.was";

    expect(() => parseWasConfigJson("{ not-json", configPath)).toThrow(
      `Invalid JSON in .was config ${configPath}:`,
    );
  });
});

describe("guardLoadedWasConfigs", () => {
  it("should accept a single valid .was object", () => {
    const configs = guardLoadedWasConfigs(validWas, "/tmp/single.was");

    expect(configs).toHaveLength(1);
    expect(configs[0]?.name).toBe("MyFont");
  });

  it("should accept an array of valid .was objects", () => {
    const configs = guardLoadedWasConfigs(
      [
        validWas,
        {
          ...validWas,
          formats: ["ttf"],
          name: "Second",
          template: "scss",
        },
      ],
      "/tmp/batch.was",
    );

    expect(configs).toHaveLength(2);
    expect(configs.map((config) => config.name)).toEqual(["MyFont", "Second"]);
  });

  it("should reject null or invalid entries with a helpful configPath error", () => {
    const nullRoot = "/tmp/null-root.was";
    expect(() => guardLoadedWasConfigs(null, nullRoot)).toThrow(
      `Invalid .was config root value in ${nullRoot}: expected an object`,
    );

    const nullItem = "/tmp/null-item.was";
    expect(() => guardLoadedWasConfigs([null], nullItem)).toThrow(
      `Invalid .was config at index 0 in ${nullItem}: expected an object`,
    );
  });

  it("should require dest, files, name, and template to be non-empty strings", () => {
    const configPath = "/tmp/incomplete.was";

    expect(() => guardLoadedWasConfigs({ ...validWas, dest: "" }, configPath)).toThrow(
      `Invalid .was config root value in ${configPath}: "dest" must be a non-empty string`,
    );

    expect(() => guardLoadedWasConfigs({ ...validWas, files: "  " }, configPath)).toThrow(
      `Invalid .was config root value in ${configPath}: "files" must be a non-empty string`,
    );

    expect(() => guardLoadedWasConfigs({ ...validWas, name: 42 }, configPath)).toThrow(
      `Invalid .was config root value in ${configPath}: "name" must be a non-empty string`,
    );

    expect(() => guardLoadedWasConfigs({ ...validWas, template: null }, configPath)).toThrow(
      `Invalid .was config root value in ${configPath}: "template" must be a non-empty string`,
    );
  });
});
