import ttf2woff from "ttf2woff";
import wawoff2 from "wawoff2";
import convertTtfToEot from "./ttf2eot";

export const encodeTtfToEot = (buffer: Buffer): Buffer => convertTtfToEot(buffer);

export const encodeTtfToWoff = (buffer: Buffer, options: { metadata?: string } = {}): Buffer =>
  Buffer.from(ttf2woff(buffer, options).buffer);

export const encodeTtfToWoff2 = async (buffer: Buffer): Promise<Buffer> =>
  Buffer.from(await wawoff2.compress(buffer));
