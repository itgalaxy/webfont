import isWoff from "is-woff";
import isWoff2 from "is-woff2";
import { getInputExtension } from "../lib/inputSourceUtils";

const assertWebfontContainer = (buffer: Buffer, source: string): void => {
  const extension = getInputExtension(source);

  if (extension === ".woff2" && !isWoff2(buffer)) {
    throw new Error(`URL did not return a valid WOFF2 font: ${source}`);
  }

  if (extension === ".woff" && !isWoff(buffer)) {
    throw new Error(`URL did not return a valid WOFF font: ${source}`);
  }

  if (buffer.length === 0) {
    throw new Error(`URL returned an empty response: ${source}`);
  }
};

export const fetchWebfontFromUrl = async (url: string): Promise<Buffer> => {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    let message = String(error);

    if (error instanceof Error) {
      message = error.message;
    }

    throw new Error(`Failed to fetch font URL ${url}: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch font URL ${url}: HTTP ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  assertWebfontContainer(buffer, url);

  return buffer;
};
