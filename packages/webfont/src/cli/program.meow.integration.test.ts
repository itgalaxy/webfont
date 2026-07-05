import * as fsPromise from "fs/promises";
import path from "path";
import { webfont } from "../standalone";
import type { ResultConfig } from "../types/ResultConfig";
import { createMeowCli } from "./meow/createMeowCli";
import { runCli } from "./program";

vi.mock("../standalone", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../standalone")>();

  return {
    ...actual,
    webfont: vi.fn(),
  };
});

const mockedWebfont = vi.mocked(webfont);

const wrapMeowCli = (argv: readonly string[]) => {
  const meowCli = createMeowCli(argv);

  return {
    ...meowCli,
    showHelp: vi.fn(),
    showVersion: vi.fn(),
  };
};

const makeResultConfig = (overrides: Partial<ResultConfig> = {}): ResultConfig => ({
  centerHorizontally: false,
  centerVertically: false,
  descent: 0,
  files: "icons/*.svg",
  fixedWidth: false,
  fontHeight: undefined,
  fontId: undefined,
  fontName: "webfont",
  fontStyle: "",
  fontWeight: "",
  formats: ["svg"],
  formatsOptions: {},
  ligatures: false,
  maxConcurrency: 1,
  metadata: undefined,
  normalize: false,
  prependUnicode: false,
  round: 1000,
  sort: false,
  startUnicode: 0xea01,
  templateFontPath: "",
  verbose: false,
  ...overrides,
});

describe("cli program with createMeowCli argv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should forward parsed flags and input globs to webfont", async () => {
    const destination = "temp/cli-program-meow";
    await fsPromise.mkdir(destination, { recursive: true });

    mockedWebfont.mockResolvedValue({
      config: makeResultConfig({
        dest: destination,
        files: "src/fixtures/svg-icons/*.svg",
        fontName: "webfont",
        formats: ["woff2"],
        formatsOptions: {},
        maxConcurrency: 1,
      }),
      woff2: Buffer.from("woff2"),
    });

    const cli = wrapMeowCli([
      "src/fixtures/svg-icons/*.svg",
      "-d",
      destination,
      "-f",
      '["woff2"]',
      "-u",
      "argv-font",
      "--no-sort",
      "--addHashInFontUrl",
    ]);

    await runCli(cli);

    expect(mockedWebfont).toHaveBeenCalledWith(
      expect.objectContaining({
        files: ["src/fixtures/svg-icons/*.svg"],
        dest: destination,
        fontName: "argv-font",
        formats: ["woff2"],
        sort: false,
        addHashInFontUrl: true,
      }),
    );
  });

  it("should call showHelp when argv has no input files", async () => {
    mockedWebfont.mockRejectedValue(new Error("Files glob patterns specified did not match any files"));
    const cli = wrapMeowCli([]);

    await expect(runCli(cli)).rejects.toThrow("Files glob patterns specified did not match any files");
    expect(cli.showHelp).toHaveBeenCalled();
  });

  it("should call showHelp and showVersion when help and version flags are set", async () => {
    const destination = "temp/cli-program-meow-help";
    await fsPromise.mkdir(destination, { recursive: true });

    mockedWebfont.mockResolvedValue({
      config: makeResultConfig({
        dest: destination,
        files: "icons/*.svg",
        fontName: "webfont",
        formats: ["svg"],
        formatsOptions: {},
        maxConcurrency: 1,
      }),
      svg: Buffer.from("svg"),
    });

    const cli = wrapMeowCli(["src/fixtures/svg-icons/*.svg", "-d", destination, "--help", "--version"]);

    await runCli(cli);

    expect(cli.showHelp).toHaveBeenCalled();
    expect(cli.showVersion).toHaveBeenCalled();
  });

  it("should combine dest-create with a parsed destination directory", async () => {
    const destination = path.join("temp/cli-program-meow", "nested", "created");
    await fsPromise.rm(destination, { recursive: true, force: true });

    mockedWebfont.mockResolvedValue({
      config: makeResultConfig({
        dest: destination,
        destCreate: true,
        files: "icons/*.svg",
        fontName: "webfont",
        formats: ["svg"],
        formatsOptions: {},
        maxConcurrency: 1,
      }),
      svg: Buffer.from("svg"),
    });

    const cli = wrapMeowCli(["src/fixtures/svg-icons/*.svg", "-d", destination, "-m"]);

    await runCli(cli);

    await fsPromise.access(destination);
    expect(mockedWebfont).toHaveBeenCalledWith(
      expect.objectContaining({
        dest: destination,
        destCreate: true,
      }),
    );
  });
});
