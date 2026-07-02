import fs from "fs";
import isWoff2 from "is-woff2";
import path from "path";
import standalone from "../standalone";
import type { InitialOptions } from "../types";
import type { ResultConfig } from "../types/ResultConfig";

type DiscoveredRcConfig = ResultConfig & { foo: string };

const fixturesRoot = path.join(__dirname, "../fixtures");
const svgFiles = path.join(fixturesRoot, "svg-icons/*.svg");
const discoveryRoot = path.join(fixturesRoot, "config-discovery");
const configsRoot = path.join(fixturesRoot, "configs");

const withCwd = async <T>(cwd: string, fn: () => Promise<T>): Promise<T> => {
  const originalCwd = process.cwd();
  process.chdir(cwd);

  try {
    return await fn();
  } finally {
    process.chdir(originalCwd);
  }
};

describe("cosmiconfig", () => {
  describe("search", () => {
    it("should discover .webfontrc.json in the working directory", async () => {
      await withCwd(path.join(discoveryRoot, "json"), async () => {
        const result = await standalone({ files: svgFiles });

        expect(result.config?.fontName).toBe("config-json-rc");
        expect(result.config?.filePath).toMatch(/\.webfontrc\.json$/u);
        expect(isWoff2(result.woff2)).toBe(true);
      });
    });

    it("should discover .webfontrc.yaml in the working directory", async () => {
      await withCwd(path.join(discoveryRoot, "yaml"), async () => {
        const result = await standalone({ files: svgFiles });

        expect(result.config?.fontName).toBe("config-yaml-rc");
        expect(result.config?.filePath).toMatch(/\.webfontrc\.yaml$/u);
        expect(isWoff2(result.woff2)).toBe(true);
      });
    });

    it("should discover an advanced .webfontrc.yaml and still generate fonts", async () => {
      await withCwd(path.join(discoveryRoot, "yaml-advanced"), async () => {
        const result = await standalone({ files: svgFiles });

        expect(result.config?.fontName).toBe("config-yaml-advanced");
        expect(result.config?.filePath).toMatch(/\.webfontrc\.yaml$/u);
        expect(result.config?.formats).toEqual(["woff2"]);
        expect(result.config?.templateFontPath).toBe("./assets/fonts/");
        // cosmiconfig v7 (`yaml` package) preserves YAML 1.1 truthy scalars as strings.
        expect(result.config?.sort).toBe("yes");
        expect(result.config?.ligatures).toBe(false);
        expect(result.config?.normalize).toBe("on");
        expect(result.config?.round).toBe(2);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error — alias-resolved keys are carried through in effective config
        expect(result.config?.displayName).toBe("config-yaml-advanced");
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        expect(result.config?.alsoFormats).toEqual(["woff2"]);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        expect(result.config?.extraFormats).toEqual(["woff2"]);
        expect(isWoff2(result.woff2)).toBe(true);
      });
    });

    it("should discover .webfontrc.js in the working directory", async () => {
      await withCwd(path.join(discoveryRoot, "js-rc"), async () => {
        const result = await standalone({ files: svgFiles });

        expect(result.config?.fontName).toBe("config-rc-js");
        expect(result.config?.filePath).toMatch(/\.webfontrc\.js$/u);
        expect(isWoff2(result.woff2)).toBe(true);
      });
    });

    it("should discover webfont.config.js in the working directory", async () => {
      await withCwd(path.join(discoveryRoot, "js-config"), async () => {
        const result = await standalone({ files: svgFiles });

        expect(result.config?.fontName).toBe("config-webfont-js");
        expect(result.config?.filePath).toMatch(/webfont\.config\.js$/u);
        expect(isWoff2(result.woff2)).toBe(true);
      });
    });

    it("should discover the webfont key in package.json", async () => {
      await withCwd(path.join(discoveryRoot, "package-json"), async () => {
        const result = await standalone({ files: svgFiles });

        expect(result.config?.fontName).toBe("config-package-json");
        expect(result.config?.filePath).toMatch(/package\.json$/u);
        expect(isWoff2(result.woff2)).toBe(true);
      });
    });

    it("should discover config files in a parent directory", async () => {
      const nestedDir = path.join(discoveryRoot, "walkup", "nested");
      fs.mkdirSync(nestedDir, { recursive: true });

      try {
        await withCwd(nestedDir, async () => {
          const result = await standalone({ files: svgFiles });

          expect(result.config?.fontName).toBe("config-walkup");
          expect(result.config?.filePath).toMatch(/\.webfontrc\.json$/u);
          expect(isWoff2(result.woff2)).toBe(true);
        });
      } finally {
        fs.rmSync(nestedDir, { recursive: true, force: true });
      }
    });

    it("should not echo filePath on result when no config was discovered", async () => {
      // Untyped callers (e.g. plain JS) may pass extra keys; filePath is output-only.
      const input = {
        files: svgFiles,
        formats: ["woff2"],
        filePath: "/fake/config/path.json",
      } as InitialOptions;

      const result = await standalone(input);

      expect(result.config?.filePath).toBeUndefined();
    });

    it("should run with defaults when no config is discoverable", async () => {
      const emptyDir = path.join("temp", "no-webfont-config");
      fs.mkdirSync(emptyDir, { recursive: true });

      try {
        await withCwd(emptyDir, async () => {
          const result = await standalone({ files: svgFiles, formats: ["woff2"] });

          expect(result.config?.filePath).toBeUndefined();
          expect(result.config?.fontName).toBe("webfont");
          expect(isWoff2(result.woff2)).toBe(true);
        });
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe("load via configFile", () => {
    it("should export the resolved config path in result.config.filePath", async () => {
      const configFile = path.join(configsRoot, ".webfontrc");
      const result = await standalone({
        configFile,
        files: svgFiles,
        formats: ["woff2"],
      });

      expect(result.config?.filePath).toBe(path.resolve(configFile));
      expect((result.config as DiscoveredRcConfig).foo).toBe("bar");
    });
  });
});
