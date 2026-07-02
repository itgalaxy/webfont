import { webfont } from "./browser";

describe("browser entry", () => {
  it("should reject with guidance when bundled for the browser (#198)", async () => {
    await expect(webfont()).rejects.toThrow("webfont is Node.js-only");
    await expect(webfont()).rejects.toThrow("TROUBLESHOOTING.md");
  });
});
