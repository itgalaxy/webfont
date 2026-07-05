import * as fsPromise from "fs/promises";
import isWoff2 from "is-woff2";
import { fetchWebfontFromUrl } from "./fetchWebfontUrl";

const fixtureWoff2 = "src/fixtures/fonts/iconfont.woff2";

describe("fetchWebfontFromUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should fetch and return a valid woff2 buffer", async () => {
    const fixture = await fsPromise.readFile(fixtureWoff2);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        arrayBuffer: async () => fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength),
      }),
    );

    const buffer = await fetchWebfontFromUrl("https://example.com/iconfont.woff2");

    expect(isWoff2(buffer)).toBe(true);
  });

  it("should reject non-success HTTP responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    );

    await expect(fetchWebfontFromUrl("https://example.com/missing.woff2")).rejects.toThrow(
      "Failed to fetch font URL https://example.com/missing.woff2: HTTP 404 Not Found",
    );
  });

  it("should reject responses that are not valid webfont containers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        arrayBuffer: async () => Buffer.from("not a font").buffer,
      }),
    );

    await expect(fetchWebfontFromUrl("https://example.com/bad.woff2")).rejects.toThrow(
      "URL did not return a valid WOFF2 font",
    );
  });
});
