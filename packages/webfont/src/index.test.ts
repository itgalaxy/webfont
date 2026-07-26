import index, {
  buildWasConfigFromWizard,
  buildWebfontOptionsReference,
  CLI_FLAG_SECTIONS,
  defaultWebfontOptions,
  guardLoadedWasConfigs,
  loadWasConfigs,
  mapWasConfigToWebfontOptions,
  parseWasConfigJson,
  type Result,
  type ResultConfig,
  type WebfontAssistantWasConfig,
  webfont,
  writeResultFiles,
} from ".";

describe("index", () => {
  it("should be exported", () => {
    expect(typeof index === "function").toBe(true);
  });

  it("should expose webfont as both the default and a named export", () => {
    expect(index).toBe(webfont);
  });

  it("should re-export the public Result and ResultConfig types", () => {
    expectTypeOf<Result["config"]>().toEqualTypeOf<ResultConfig | undefined>();
    expectTypeOf<ResultConfig>().toHaveProperty("filePath");
    expectTypeOf<ResultConfig["filePath"]>().toEqualTypeOf<string | undefined>();
  });

  it("should export writeResultFiles for programmatic disk writes", () => {
    expect(typeof writeResultFiles).toBe("function");
  });

  it("should export options reference helpers for tooling and agents", () => {
    expect(CLI_FLAG_SECTIONS.length).toBeGreaterThan(0);
    expect(defaultWebfontOptions().fontName).toBe("webfont");
    expect(buildWebfontOptionsReference().defaults).toEqual(defaultWebfontOptions());
    expect(buildWebfontOptionsReference().cliFlags.fontName.long).toBe("--fontName");
    expect(buildWebfontOptionsReference().cliFlags.assistant.long).toBe("--assistant");
  });

  it("should export headless assistant helpers for .was configs", () => {
    const was: WebfontAssistantWasConfig = {
      dest: "dist/fonts",
      files: "icons/*.svg",
      name: "FixtureFont",
      prefix: "fixture-icon",
      template: "css",
    };

    expect(typeof loadWasConfigs).toBe("function");
    expect(typeof parseWasConfigJson).toBe("function");
    expect(typeof guardLoadedWasConfigs).toBe("function");
    expect(typeof mapWasConfigToWebfontOptions).toBe("function");
    expect(typeof buildWasConfigFromWizard).toBe("function");
    expect(mapWasConfigToWebfontOptions(was).templateClassName).toBe("fixture-icon");
  });
});
