import { getSfntFlavor } from "./flavor";

describe("getSfntFlavor", () => {
  it("should detect TrueType sfnt with version 1.0 signature", () => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(0x00_01_00_00, 0);

    expect(getSfntFlavor(buffer)).toBe("ttf");
  });

  it("should detect TrueType sfnt with true signature", () => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(0x74_72_75_65, 0);

    expect(getSfntFlavor(buffer)).toBe("ttf");
  });

  it("should detect OpenType sfnt with OTTO signature", () => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(0x4f_54_54_4f, 0);

    expect(getSfntFlavor(buffer)).toBe("otf");
  });

  it("should reject buffers that are too short", () => {
    expect(() => getSfntFlavor(Buffer.alloc(3))).toThrow("SFNT buffer is too short to read flavor");
  });

  it("should reject unknown sfnt signatures", () => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(0xdead_beef, 0);

    expect(() => getSfntFlavor(buffer)).toThrow("Unsupported SFNT flavor 0xdeadbeef");
  });
});
