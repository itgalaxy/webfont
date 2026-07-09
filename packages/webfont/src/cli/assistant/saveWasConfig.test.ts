import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { saveWasConfig } from "./saveWasConfig";

describe("saveWasConfig", () => {
  it("should persist cleaned name and matching .was filename", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webfont-save-was-"));
    try {
      const configPath = await saveWasConfig({
        dest: dir,
        files: "icons/*.svg",
        formats: ["woff2"],
        name: "../MyFont",
        template: "css",
      });

      expect(configPath).toBe(join(dir, "MyFont.was"));

      const payload = JSON.parse(await readFile(configPath, "utf8")) as { name: string };
      expect(payload.name).toBe("MyFont");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
