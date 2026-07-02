import { loadWebfontConfig } from "../standalone";
import type { CliLike } from "./program";
import { resolveCliFiles } from "./resolveCliFiles";

vi.mock("../standalone", () => ({
  loadWebfontConfig: vi.fn(),
}));

const mockedLoadWebfontConfig = vi.mocked(loadWebfontConfig);

const createCli = (overrides: Partial<CliLike> = {}): CliLike => ({
  flags: {},
  input: [],
  showHelp: vi.fn(),
  showVersion: vi.fn(),
  ...overrides,
});

describe("resolveCliFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return CLI positional input when no config files are set", async () => {
    mockedLoadWebfontConfig.mockResolvedValue({});

    const files = await resolveCliFiles(createCli({ input: ["icons/*.svg"] }), {});

    expect(files).toEqual(["icons/*.svg"]);
  });

  it("should return files from config when CLI input is empty", async () => {
    mockedLoadWebfontConfig.mockResolvedValue({
      config: {
        files: ["a.svg", "b.svg"],
      },
      filepath: "/tmp/webfont.config.json",
      isEmpty: false,
    });

    const files = await resolveCliFiles(createCli(), { configFile: "/tmp/webfont.config.json" });

    expect(files).toEqual(["a.svg", "b.svg"]);
  });

  it("should normalize a single config files string to an array", async () => {
    mockedLoadWebfontConfig.mockResolvedValue({
      config: {
        files: "icons/*.svg",
      },
      filepath: "/tmp/webfont.config.json",
      isEmpty: false,
    });

    const files = await resolveCliFiles(createCli(), { configFile: "/tmp/webfont.config.json" });

    expect(files).toEqual(["icons/*.svg"]);
  });

  it("should throw when CLI input and config files are both provided", async () => {
    mockedLoadWebfontConfig.mockResolvedValue({
      config: {
        files: ["a.svg", "b.svg"],
      },
      filepath: "/tmp/webfont.config.json",
      isEmpty: false,
    });

    await expect(
      resolveCliFiles(createCli({ input: ["only.svg"] }), { configFile: "/tmp/webfont.config.json" }),
    ).rejects.toThrow("Cannot specify input files on the command line when `files` is set in the config file");
  });

  it("should return an empty array when neither CLI input nor config files are set", async () => {
    mockedLoadWebfontConfig.mockResolvedValue({});

    const files = await resolveCliFiles(createCli(), {});

    expect(files).toEqual([]);
  });
});
