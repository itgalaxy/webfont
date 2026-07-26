import { describe, expect, it } from "vitest";
import { buildWasConfigFromWizard } from "./buildWasConfig";

describe("buildWasConfigFromWizard", () => {
  it("should persist prefix but not deprecated .was fontName for new wizard configs", () => {
    const config = buildWasConfigFromWizard(
      {
        glyphs: "assets/images/svg",
        name: "MyAwesomeFont",
        output: "assets/fonts",
        prefix: "my-icon",
      },
      {
        formats: ["woff2"],
        isCustomTemplate: false,
        styleType: "css",
        template: "css",
      },
    );

    expect(config.prefix).toBe("my-icon");
    expect(config.fontId).toBe("my-icon");
    expect(config.name).toBe("MyAwesomeFont");
    expect(config).not.toHaveProperty("fontName");
  });
});
