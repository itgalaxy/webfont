import { createMetadataFromSrcPathService } from "./metadataFromSrcPath";

const getMetadata = (
  srcPath: string,
  options?: Parameters<typeof createMetadataFromSrcPathService>[0],
  service = createMetadataFromSrcPathService(options),
) =>
  new Promise<{ name: string; unicode: string[] }>((resolve, reject) => {
    service(srcPath, (error, metadata) => {
      if (error || !metadata) {
        reject(error ?? new Error("missing metadata"));
        return;
      }

      resolve({ name: metadata.name, unicode: metadata.unicode });
    });
  });

describe("createMetadataFromSrcPathService", () => {
  it("assigns sequential unicode from filename when no prefix is present", async () => {
    const service = createMetadataFromSrcPathService();
    const first = await getMetadata("icons/home.svg", undefined, service);
    const second = await getMetadata("icons/user.svg", undefined, service);

    expect(first.name).toBe("home");
    expect(first.unicode[0]).toBe(String.fromCodePoint(0xea01));
    expect(second.unicode[0]).toBe(String.fromCodePoint(0xea02));
  });

  it("reads unicode prefix from filename", async () => {
    const metadata = await getMetadata("uE900-custom.svg");

    expect(metadata.name).toBe("custom");
    expect(metadata.unicode[0]).toBe(String.fromCodePoint(0xe900));
  });

  it("rejects prependUnicode in browser-safe mode", async () => {
    await expect(getMetadata("home.svg", { prependUnicode: true, startUnicode: 0xea01 })).rejects.toThrow(
      /prependUnicode/,
    );
  });
});
