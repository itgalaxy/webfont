import { describe, expect, it } from "vitest";
import { mapWasConfigToWebfontOptions } from "./mapWasConfigToWebfontOptions";

describe("mapWasConfigToWebfontOptions", () => {
  it("should map legacy .was configs that store the icon prefix in fontName", () => {
    const options = mapWasConfigToWebfontOptions({
      dest: "dist/fonts",
      files: "icons/*.svg",
      fontName: "my-icon",
      formats: ["woff2"],
      name: "MyAwesomeFont",
      template: "css",
    });

    expect(options.fontName).toBe("MyAwesomeFont");
    expect(options.templateClassName).toBe("my-icon");
    expect(options.templateFontName).toBe("MyAwesomeFont");
    expect(options.destCreate).toBe(true);
  });

  it("should prefer prefix over legacy fontName when both are present", () => {
    const options = mapWasConfigToWebfontOptions({
      dest: "dist/fonts",
      files: "icons/*.svg",
      fontName: "legacy-prefix",
      formats: ["ttf"],
      name: "BrandIcons",
      prefix: "brand-icon",
      template: "scss",
    });

    expect(options.templateClassName).toBe("brand-icon");
    expect(options.fontId).toBe("brand-icon");
  });
});
