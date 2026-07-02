import * as fs from "fs";
import * as fsPromise from "fs/promises";
import path from "path";
import { webfont } from "../standalone";
import type { Result } from "../types/Result";
import {
  buildOptionsBase,
  type CliLike,
  ensureResultConfig,
  getDecompressedFontOutputBasename,
  getExitCode,
  getResultOutputPath,
  mergeCliDestIntoConfig,
  resolveDestTemplate,
  runCli,
  startCli,
  writeDecompressedFontFiles,
  writeResultFiles,
} from "./program";

vi.mock("../standalone", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../standalone")>();

  return {
    ...actual,
    webfont: vi.fn(),
  };
});

const mockedWebfont = vi.mocked(webfont);

const createCli = (overrides: Partial<CliLike> = {}): CliLike => ({
  flags: {},
  input: ["src/fixtures/svg-icons/*.svg"],
  showHelp: vi.fn(),
  showVersion: vi.fn(),
  ...overrides,
});

describe("cli program", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildOptionsBase", () => {
    it("should map all supported CLI flags to options", () => {
      const options = buildOptionsBase(
        createCli({
          flags: {
            ascent: "10",
            addHashInFontUrl: true,
            centerHorizontally: true,
            config: "webfont.config.js",
            descent: "5",
            dest: "temp/out",
            destCreate: true,
            destTemplate: "temp/templates",
            fixedWidth: true,
            fontHeight: "100",
            fontId: "id",
            fontName: "my-font",
            fontStyle: "italic",
            fontWeight: "700",
            formats: '["woff2"]',
            ligatures: false,
            metadata: "meta",
            normalize: true,
            prependUnicode: true,
            // meow string flag — matches CliLike.flags.round (see AGENTS.md § createCli vs createMeowCli)
            round: "1",
            sort: false,
            startUnicode: "0xea01",
            template: "css",
            templateCacheString: "cache",
            templateClassName: "icon",
            templateFontName: "icon-font",
            templateFontPath: "./fonts",
            verbose: true,
          },
        }),
      );

      expect(options.configFile).toContain("webfont.config.js");
      expect(options.fontName).toBe("my-font");
      expect(options.formats).toEqual(["woff2"]);
      expect(options.dest).toBe("temp/out");
      expect(options.destCreate).toBe(true);
      expect(options.template).toBe("css");
      expect(options.templateClassName).toBe("icon");
      expect(options.templateFontPath).toBe("./fonts");
      expect(options.templateFontName).toBe("icon-font");
      expect(options.templateCacheString).toBe("cache");
      expect(options.destTemplate).toBe("temp/templates");
      expect(options.verbose).toBe(true);
      expect(options.fontId).toBe("id");
      expect(options.fontStyle).toBe("italic");
      expect(options.fontWeight).toBe("700");
      expect(options.fixedWidth).toBe(true);
      expect(options.centerHorizontally).toBe(true);
      expect(options.normalize).toBe(true);
      expect(options.fontHeight).toBe("100");
      expect(options.round).toBe("1");
      expect(options.descent).toBe("5");
      expect(options.ascent).toBe("10");
      expect(options.startUnicode).toBe("0xea01");
      expect(options.prependUnicode).toBe(true);
      expect(options.metadata).toBe("meta");
      expect(options.sort).toBe(false);
      expect(options.ligatures).toBe(false);
      expect(options.addHashInFontUrl).toBe(true);
    });
  });

  describe("ensureResultConfig", () => {
    it("should throw Missing config in webfont result when config is absent", () => {
      expect(() => ensureResultConfig({})).toThrow("Missing config in webfont result");
    });

    it("should return config when present", () => {
      const config = {
        files: "icons/*.svg",
        fontName: "webfont",
        formats: ["svg"],
        formatsOptions: {},
        maxConcurrency: 1,
      };

      expect(ensureResultConfig({ config })).toBe(config);
    });
  });

  describe("mergeCliDestIntoConfig", () => {
    it("should throw Missing config in webfont result when merging dest options", () => {
      expect(() => mergeCliDestIntoConfig({}, { dest: "temp/out" })).toThrow("Missing config in webfont result");
    });

    it("should merge dest and destTemplate into result config", () => {
      const result: Result = {
        config: {
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
      };

      mergeCliDestIntoConfig(result, {
        dest: "temp/out",
        destTemplate: "temp/templates",
      });

      expect(result.config?.dest).toBe("temp/out");
      expect(result.config?.destTemplate).toBe("temp/templates");
    });
  });

  describe("resolveDestTemplate", () => {
    it("should resolve built-in template destination", () => {
      const config = {
        dest: "temp/out",
        fontName: "webfont",
        template: "css",
      };

      const destTemplate = resolveDestTemplate(
        {
          template: "css-content",
          usedBuildInTemplate: true,
        },
        config as never,
      );

      expect(destTemplate).toBe(path.join("temp/out", "webfont.css"));
    });

    it("should resolve the first template when template is an array (#158)", () => {
      const config = {
        dest: "temp/out",
        fontName: "webfont",
        template: ["html", "scss"],
      };

      const destTemplate = resolveDestTemplate(
        {
          template: "html-content",
          usedBuildInTemplate: true,
        },
        config as never,
      );

      expect(destTemplate).toBe(path.join("temp/out", "webfont.html"));
    });

    it("should resolve destTemplate when provided explicitly", () => {
      const config = {
        dest: "temp/out",
        destTemplate: "temp/templates",
        fontName: "webfont",
        template: "css",
      };

      const destTemplate = resolveDestTemplate(
        {
          template: "css-content",
          usedBuildInTemplate: true,
        },
        config as never,
      );

      expect(destTemplate).toBe(path.join("temp/templates", "webfont.css"));
    });

    it("should return destTemplate fallback when template type is unknown", () => {
      const config = {
        dest: "temp/out",
        fontName: "webfont",
      };

      const destTemplate = resolveDestTemplate(
        {
          template: "css-content",
        },
        config as never,
      );

      expect(destTemplate).toBe("temp/out");
    });

    it("should resolve custom template paths by stripping the .njk extension", () => {
      const config = {
        dest: "temp/out",
        destTemplate: "temp/templates",
        fontName: "webfont",
        template: "custom/foo.njk",
      };

      const destTemplate = resolveDestTemplate(
        {
          template: "custom-content",
          usedBuildInTemplate: false,
        },
        config as never,
      );

      expect(destTemplate).toBe(path.join("temp/templates", "foo"));
    });
  });

  describe("getResultOutputPath", () => {
    it("should resolve hash and font output paths", () => {
      const config = {
        dest: "temp/out",
        fontName: "webfont",
      };

      expect(getResultOutputPath("hash", {}, config as never)).toBe(path.resolve("temp/out/webfont.hash"));
      expect(getResultOutputPath("woff2", {}, config as never)).toBe(path.resolve("temp/out/webfont.woff2"));
      expect(getResultOutputPath("template", {}, config as never, "temp/templates/webfont.css")).toBe(
        path.resolve("temp/templates/webfont.css"),
      );
    });
  });

  describe("ensureDestExists", () => {
    const destination = "temp/cli-program-ensure-dest";

    beforeEach(async () => {
      await fsPromise.rm(destination, { recursive: true, force: true });
    });

    it("should create the destination when destCreate is enabled", async () => {
      const { ensureDestExists } = await import("./program");

      await ensureDestExists(destination, true);
      await fsPromise.access(destination);
    });

    it("should reject when destination is missing and destCreate is disabled", async () => {
      const { ensureDestExists } = await import("./program");

      await expect(ensureDestExists(destination, false)).rejects.toThrow(
        `Destination directory "${destination}" does not exist. Use --dest-create (-m) to create it.`,
      );
    });
  });

  describe("getDecompressedFontOutputBasename", () => {
    it("should use fontName for a single decompressed font", () => {
      const fonts = [{ source: "fonts/Inter.woff2", ttf: Buffer.from("ttf") }];

      expect(getDecompressedFontOutputBasename(fonts, fonts[0], { fontName: "my-font" } as never)).toBe("my-font");
    });

    it("should disambiguate basenames for batch decompression", () => {
      const fonts = [
        { source: "src/fixtures/fonts/iconfont.woff", ttf: Buffer.from("a") },
        { source: "src/fixtures/fonts/iconfont.woff2", ttf: Buffer.from("b") },
      ];

      expect(getDecompressedFontOutputBasename(fonts, fonts[0], { fontName: "webfont" } as never)).toBe(
        "iconfont-woff",
      );
      expect(getDecompressedFontOutputBasename(fonts, fonts[1], { fontName: "webfont" } as never)).toBe(
        "iconfont-woff2",
      );
    });
  });

  describe("writeDecompressedFontFiles", () => {
    it("should write one ttf per decompressed font", async () => {
      const destination = "temp/cli-program-batch";
      await fsPromise.mkdir(destination, { recursive: true });

      await writeDecompressedFontFiles(
        [
          { source: "src/fixtures/fonts/iconfont.woff", ttf: Buffer.from("woff-ttf") },
          { source: "src/fixtures/fonts/iconfont.woff2", ttf: Buffer.from("woff2-ttf") },
        ],
        {
          dest: destination,
          fontName: "webfont",
        } as never,
        destination,
      );

      expect(await fsPromise.readFile(path.join(destination, "iconfont-woff.ttf"), "utf8")).toBe("woff-ttf");
      expect(await fsPromise.readFile(path.join(destination, "iconfont-woff2.ttf"), "utf8")).toBe("woff2-ttf");
    });
  });

  describe("writeResultFiles", () => {
    const destination = "temp/cli-program";

    beforeEach(async () => {
      await fsPromise.mkdir(destination, { recursive: true });
      await fsPromise.rm(destination, { recursive: true, force: true });
      await fsPromise.mkdir(destination, { recursive: true });
    });

    it("should write batch decompressed fonts without using fontName for every file", async () => {
      const result: Result = {
        config: {
          dest: destination,
          files: ["src/fixtures/fonts/iconfont.woff", "src/fixtures/fonts/iconfont.woff2"],
          fontName: "webfont",
          formats: ["ttf"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        decompressedFonts: [
          { source: "src/fixtures/fonts/iconfont.woff", ttf: Buffer.from("woff-ttf") },
          { source: "src/fixtures/fonts/iconfont.woff2", ttf: Buffer.from("woff2-ttf") },
        ],
      };

      await writeResultFiles(result);

      const files = await fsPromise.readdir(destination);
      expect(files).toEqual(expect.arrayContaining(["iconfont-woff.ttf", "iconfont-woff2.ttf"]));
    });

    it("should write font outputs and hash files", async () => {
      const result: Result = {
        config: {
          dest: destination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg", "woff2"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        hash: "abc123",
        svg: Buffer.from("svg"),
        woff2: Buffer.from("woff2"),
      };

      await writeResultFiles(result);

      const files = await fsPromise.readdir(destination);
      expect(files).toEqual(expect.arrayContaining(["webfont.hash", "webfont.svg", "webfont.woff2"]));
      expect(await fsPromise.readFile(path.join(destination, "webfont.hash"), "utf8")).toBe("abc123");
    });

    it("should write template files to the resolved destination", async () => {
      const result: Result = {
        config: {
          dest: destination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
          template: "css",
        },
        svg: Buffer.from("svg"),
        template: "body { color: red; }",
        usedBuildInTemplate: true,
      };

      await writeResultFiles(result);

      await fsPromise.access(path.join(destination, "webfont.css"));
      expect(await fsPromise.readFile(path.join(destination, "webfont.css"), "utf8")).toBe("body { color: red; }");
    });

    it("should write multiple template files (#158)", async () => {
      const result: Result = {
        config: {
          dest: destination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
          template: ["html", "scss"],
        },
        svg: Buffer.from("svg"),
        template: "<html></html>",
        templates: [
          { template: "html", content: "<html></html>", builtIn: "html" },
          { template: "scss", content: "$x: 1;", builtIn: "scss" },
        ],
        usedBuildInTemplate: true,
      };

      await writeResultFiles(result);

      expect(await fsPromise.readFile(path.join(destination, "webfont.html"), "utf8")).toBe("<html></html>");
      expect(await fsPromise.readFile(path.join(destination, "webfont.scss"), "utf8")).toBe("$x: 1;");
    });

    it("should create destination when destCreate is enabled", async () => {
      const nestedDestination = path.join(destination, "nested", "fonts");
      const result: Result = {
        config: {
          dest: nestedDestination,
          destCreate: true,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
      };

      await writeResultFiles(result);

      await fsPromise.access(nestedDestination);
      await fsPromise.access(path.join(nestedDestination, "webfont.svg"));
    });

    it("should reject with a clear error when destination is missing and destCreate is disabled", async () => {
      const missingDestination = path.join(destination, "missing", "fonts");
      const result: Result = {
        config: {
          dest: missingDestination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
      };

      await expect(writeResultFiles(result)).rejects.toThrow(
        `Destination directory "${missingDestination}" does not exist. Use --dest-create (-m) to create it.`,
      );
      await expect(fsPromise.access(missingDestination)).rejects.toMatchObject({ code: "ENOENT" });
    });

    it("should not write files when destination is missing", async () => {
      const missingDestination = path.join(destination, "missing-no-write");
      const writeSpy = vi.spyOn(fs.promises, "writeFile");
      const result: Result = {
        config: {
          dest: missingDestination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
        woff2: Buffer.from("woff2"),
      };

      await expect(writeResultFiles(result)).rejects.toThrow(/Destination directory/u);
      expect(writeSpy).not.toHaveBeenCalled();
      writeSpy.mockRestore();
    });

    it("should propagate write errors", async () => {
      const writeSpy = vi.spyOn(fs.promises, "writeFile").mockRejectedValueOnce(new Error("disk full"));
      const result: Result = {
        config: {
          dest: destination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
      };

      await expect(writeResultFiles(result)).rejects.toThrow("disk full");
      writeSpy.mockRestore();
    });
  });

  describe("getExitCode", () => {
    it("should return numeric error code when present", () => {
      expect(getExitCode({ code: 42 })).toBe(42);
    });

    it("should default to exit code 1", () => {
      expect(getExitCode(new Error("boom"))).toBe(1);
    });
  });

  describe("runCli", () => {
    it("should show help when no input files are provided", async () => {
      mockedWebfont.mockRejectedValue(new Error("Files glob patterns specified did not match any files"));
      const cli = createCli({ input: [] });

      await expect(runCli(cli)).rejects.toThrow("Files glob patterns specified did not match any files");
      expect(cli.showHelp).toHaveBeenCalled();
    });

    it("should throw Missing config in webfont result when webfont returns no config", async () => {
      mockedWebfont.mockResolvedValue({
        svg: Buffer.from("svg"),
      });

      await expect(runCli(createCli())).rejects.toThrow("Missing config in webfont result");
    });

    it("should invoke help and version handlers when flags are set", async () => {
      mockedWebfont.mockResolvedValue({
        config: {
          dest: "temp/cli-program-run",
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
      });

      const cli = createCli({
        flags: {
          help: true,
          version: true,
        },
      });

      await runCli(cli);

      expect(cli.showHelp).toHaveBeenCalled();
      expect(cli.showVersion).toHaveBeenCalled();
    });

    it("should run webfont and write files when config is present", async () => {
      const destination = "temp/cli-program-run";
      await fsPromise.mkdir(destination, { recursive: true });

      mockedWebfont.mockResolvedValue({
        config: {
          dest: destination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
        hash: "hash-value",
      });

      const result = await runCli(
        createCli({
          flags: {
            dest: destination,
          },
        }),
      );

      expect(mockedWebfont).toHaveBeenCalled();
      expect(result.config?.dest).toBe(destination);
      expect(await fsPromise.readFile(path.join(destination, "webfont.svg"))).toBeTruthy();
    });

    it("should fail with a clear error when destination is missing", async () => {
      const missingDestination = "temp/cli-program-missing-dest";

      mockedWebfont.mockResolvedValue({
        config: {
          dest: missingDestination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
      });

      await expect(
        runCli(
          createCli({
            flags: {
              dest: missingDestination,
            },
          }),
        ),
      ).rejects.toThrow(
        `Destination directory "${missingDestination}" does not exist. Use --dest-create (-m) to create it.`,
      );
    });
  });

  describe("startCli", () => {
    it("should exit with the resolved code when runCli fails", async () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as typeof process.exit);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const cli = createCli();
      const error = Object.assign(new Error("Missing config in webfont result"), { code: 7 });

      mockedWebfont.mockRejectedValue(error);

      startCli(cli);

      await new Promise<void>((resolve) => {
        const waitForExit = (): void => {
          if (exitSpy.mock.calls.length > 0) {
            resolve();
            return;
          }

          setImmediate(waitForExit);
        };

        waitForExit();
      });

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Missing config in webfont result"));
      expect(exitSpy).toHaveBeenCalledWith(7);

      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    it("should exit with code 1 and log a clear error when destination is missing", async () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as typeof process.exit);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const missingDestination = "temp/cli-program-missing-start";
      const cli = createCli({
        flags: {
          dest: missingDestination,
        },
      });

      mockedWebfont.mockResolvedValue({
        config: {
          dest: missingDestination,
          files: "icons/*.svg",
          fontName: "webfont",
          formats: ["svg"],
          formatsOptions: {},
          maxConcurrency: 1,
        },
        svg: Buffer.from("svg"),
      });

      startCli(cli);

      await new Promise<void>((resolve) => {
        const waitForExit = (): void => {
          if (exitSpy.mock.calls.length > 0) {
            resolve();
            return;
          }

          setImmediate(waitForExit);
        };

        waitForExit();
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Destination directory "${missingDestination}" does not exist`),
      );
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("--dest-create"));
      expect(exitSpy).toHaveBeenCalledWith(1);

      exitSpy.mockRestore();
      logSpy.mockRestore();
    });
  });
});
