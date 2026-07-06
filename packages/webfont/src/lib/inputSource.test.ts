import * as fsPromise from "node:fs/promises";
import path from "node:path";
import { globby } from "globby";
import {
  getInputExtension,
  getWebfontSourceBasename,
  isHttpUrl,
  resolveDecompressedFontBasenames,
  resolveInputSources,
} from "./inputSource";

describe("isHttpUrl", () => {
  it("should detect http and https URLs", () => {
    expect(isHttpUrl("https://example.com/font.woff2")).toBe(true);
    expect(isHttpUrl("http://example.com/font.woff")).toBe(true);
    expect(isHttpUrl("src/fixtures/fonts/iconfont.woff2")).toBe(false);
  });
});

describe("getInputExtension", () => {
  it("should read extensions from local paths", () => {
    expect(getInputExtension("src/fixtures/fonts/iconfont.woff2")).toBe(".woff2");
    expect(getInputExtension("src/fixtures/svg-icons/avatar.svg")).toBe(".svg");
  });

  it("should ignore query strings in URLs", () => {
    expect(getInputExtension("https://cdn.example/fonts/Inter.woff2?v=1")).toBe(".woff2");
    expect(getInputExtension("https://cdn.example/fonts/Inter.woff?token=abc")).toBe(".woff");
  });

  it("should return empty for extension-less URLs", () => {
    expect(getInputExtension("https://cdn.example/download")).toBe("");
  });
});

describe("getWebfontSourceBasename", () => {
  it("should strip webfont container extensions from filenames", () => {
    expect(getWebfontSourceBasename("fonts/Inter-Medium.woff2")).toBe("Inter-Medium");
    expect(getWebfontSourceBasename("fonts/Inter-Medium.woff")).toBe("Inter-Medium");
    expect(getWebfontSourceBasename("https://cdn.example/Inter-Bold.woff2")).toBe("Inter-Bold");
  });
});

describe("resolveDecompressedFontBasenames", () => {
  it("should keep unique basenames unchanged", () => {
    expect(resolveDecompressedFontBasenames(["fonts/Inter-Regular.woff2", "fonts/Inter-Bold.woff2"])).toEqual([
      "Inter-Regular",
      "Inter-Bold",
    ]);
  });

  it("should disambiguate colliding basenames using container suffixes", () => {
    expect(
      resolveDecompressedFontBasenames(["src/fixtures/fonts/iconfont.woff", "src/fixtures/fonts/iconfont.woff2"]),
    ).toEqual(["iconfont-woff", "iconfont-woff2"]);
  });
});

describe("resolveInputSources", () => {
  it("should expand local glob patterns to matched files", async () => {
    const sources = await resolveInputSources(["src/fixtures/svg-icons/envelope.svg"]);

    expect(sources).toEqual(["src/fixtures/svg-icons/envelope.svg"]);
  });
});

describe("globby gitignore contract via globby 16.2.1", () => {
  it.skipIf(process.platform === "win32")(
    "should not ignore an entire checkout when cwd sits under an anchored gitignore ancestor path",
    async () => {
      // Regression for globby 16.2.0 → 16.2.1 (sindresorhus/globby#277): anchored `/tmp` must not
      // prune the whole tree when the checkout lives under `/tmp/...`.
      const cwd = await fsPromise.mkdtemp(path.join("/tmp", "webfont-globby-"));
      const iconPath = path.join(cwd, "icon.svg");

      try {
        await fsPromise.writeFile(path.join(cwd, ".gitignore"), "/tmp\n");
        await fsPromise.writeFile(iconPath, "<svg></svg>");

        const matches = await globby("*.svg", {
          absolute: true,
          cwd,
          gitignore: true,
        });

        expect(matches).toContain(iconPath);
      } finally {
        await fsPromise.rm(cwd, { force: true, recursive: true });
      }
    },
  );
});
