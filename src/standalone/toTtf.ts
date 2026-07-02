import svg2ttf from "svg2ttf";

export type ToTtfOptions = Parameters<typeof svg2ttf>[1];

const toTtf = (svgFontString: string, options: ToTtfOptions = {}): Buffer =>
  Buffer.from(svg2ttf(svgFontString, options).buffer);

export default toTtf;
