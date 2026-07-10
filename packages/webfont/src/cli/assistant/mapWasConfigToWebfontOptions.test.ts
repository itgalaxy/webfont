import { describe, expect, it } from "vitest";
import { mapWasConfigToWebfontOptions } from "./mapWasConfigToWebfontOptions";
import type { WebfontAssistantWasConfig } from "./types";

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

  it("should not override webfont defaults when fixedWidth and fontHeight are omitted from .was", () => {
    const options = mapWasConfigToWebfontOptions({
      dest: "dist/fonts",
      files: "icons/*.svg",
      fontName: "my-icon",
      formats: ["woff2"],
      name: "MyAwesomeFont",
      template: "css",
    });

    expect(options.fixedWidth).toBeUndefined();
    expect(options.fontHeight).toBeUndefined();
  });

  it("should apply fixedWidth and fontHeight when explicitly set in .was", () => {
    const options = mapWasConfigToWebfontOptions({
      dest: "dist/fonts",
      files: "icons/*.svg",
      fixedWidth: true,
      fontHeight: 1000,
      formats: ["ttf"],
      name: "MyAwesomeFont",
      prefix: "my-icon",
      template: "css",
    });

    expect(options.fixedWidth).toBe(true);
    expect(options.fontHeight).toBe(1000);
  });

  it("should default formats when .was omits or provides invalid formats", () => {
    const base = {
      dest: "dist/fonts",
      files: "icons/*.svg",
      name: "MyAwesomeFont",
      template: "css",
    };

    expect(
      mapWasConfigToWebfontOptions({
        ...base,
      }).formats,
    ).toEqual(["ttf"]);

    expect(
      mapWasConfigToWebfontOptions({
        ...base,
        formats: undefined,
      }).formats,
    ).toEqual(["ttf"]);

    expect(
      mapWasConfigToWebfontOptions({
        ...base,
        formats: "woff2" as unknown as WebfontAssistantWasConfig["formats"],
      }).formats,
    ).toEqual(["ttf"]);
  });

  it("should clean path segments from .was names used for font output", () => {
    const options = mapWasConfigToWebfontOptions({
      dest: "dist/fonts",
      files: "icons/*.svg",
      formats: ["woff2"],
      name: "../EvilFont",
      prefix: "../evil-prefix",
      template: "css",
    });

    expect(options.fontName).toBe("EvilFont");
    expect(options.templateClassName).toBe("evil-prefix");
    expect(options.templateFontName).toBe("EvilFont");
  });

  it("should reject non-string optional .was basename fields with a clear error", () => {
    const base = {
      dest: "dist/fonts",
      files: "icons/*.svg",
      formats: ["ttf"] as WebfontAssistantWasConfig["formats"],
      name: "MyAwesomeFont",
      template: "css",
    };

    expect(() =>
      mapWasConfigToWebfontOptions({
        ...base,
        prefix: 42 as unknown as WebfontAssistantWasConfig["prefix"],
      }),
    ).toThrow('Invalid .was config: "prefix" must be a string');

    expect(() =>
      mapWasConfigToWebfontOptions({
        ...base,
        fontId: { bad: true } as unknown as WebfontAssistantWasConfig["fontId"],
      }),
    ).toThrow('Invalid .was config: "fontId" must be a string');

    expect(() =>
      mapWasConfigToWebfontOptions({
        ...base,
        fontName: 99 as unknown as WebfontAssistantWasConfig["fontName"],
      }),
    ).toThrow('Invalid .was config: "fontName" must be a string');

    expect(() =>
      mapWasConfigToWebfontOptions({
        ...base,
        templateFontName: false as unknown as WebfontAssistantWasConfig["templateFontName"],
      }),
    ).toThrow('Invalid .was config: "templateFontName" must be a string');
  });

  it("should ignore blank optional prefix and fall back to the font display name", () => {
    const options = mapWasConfigToWebfontOptions({
      dest: "dist/fonts",
      files: "icons/*.svg",
      formats: ["woff2"],
      name: "MyAwesomeFont",
      prefix: "   ",
      template: "css",
    });

    expect(options.templateClassName).toBe("MyAwesomeFont");
    expect(options.fontId).toBe("MyAwesomeFont");
  });
});
