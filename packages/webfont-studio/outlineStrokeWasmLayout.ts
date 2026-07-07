/** Parse SVG dimensions for rasterization (browser worker outline-stroke WASM). */
export const parseSvgLayout = (svgContents: string): { height: number; viewBox: string; width: number } => {
  const viewBoxMatch = /viewBox\s*=\s*["']([^"']+)["']/iu.exec(svgContents);

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/[\s,]+/u).map(Number);

    if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
      return {
        viewBox: viewBoxMatch[1],
        width: parts[2],
        height: parts[3],
      };
    }
  }

  const widthMatch = /width\s*=\s*["']([\d.]+)/iu.exec(svgContents);
  const heightMatch = /height\s*=\s*["']([\d.]+)/iu.exec(svgContents);
  let width = 24;
  let height = 24;

  if (widthMatch) {
    width = Number(widthMatch[1]);
  }

  if (heightMatch) {
    height = Number(heightMatch[1]);
  }

  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
  };
};

export const buildOutlinedSvg = (viewBox: string, pathElements: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${pathElements}</svg>`;

export const computeRasterSize = (
  width: number,
  height: number,
  scale: number,
): { height: number; width: number } => {
  const rasterWidth = Math.max(64, Math.round(width * scale));
  const rasterHeight = Math.max(64, Math.round(height * scale));

  return { width: rasterWidth, height: rasterHeight };
};
