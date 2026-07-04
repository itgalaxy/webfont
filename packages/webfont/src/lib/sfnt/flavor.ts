export type SfntFlavor = "otf" | "ttf";

const OTTO_SIGNATURE = 0x4f_54_54_4f;
const TRUE_SIGNATURE = 0x74_72_75_65;
const VERSION_1_SIGNATURE = 0x00_01_00_00;

export const getSfntFlavor = (buffer: Buffer): SfntFlavor => {
  if (buffer.length < 4) {
    throw new Error("SFNT buffer is too short to read flavor");
  }

  const signature = buffer.readUInt32BE(0);

  if (signature === OTTO_SIGNATURE) {
    return "otf";
  }

  if (signature === TRUE_SIGNATURE || signature === VERSION_1_SIGNATURE) {
    return "ttf";
  }

  throw new Error(`Unsupported SFNT flavor 0x${signature.toString(16)}`);
};
