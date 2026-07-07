export interface ViewBoxRect {
  height: number;
  minX: number;
  minY: number;
  width: number;
}

export const parseViewBoxRect = (viewBox: string): ViewBoxRect => {
  const parts = viewBox.split(/[\s,]+/u).map(Number);

  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    return { minX: 0, minY: 0, width: 24, height: 24 };
  }

  return {
    minX: parts[0],
    minY: parts[1],
    width: parts[2],
    height: parts[3],
  };
};

/** Map SVG paint keywords to canvas colors (Potrace expects black strokes/fills on white). */
export const resolveSvgPaintColor = (value: string | null | undefined): string | null => {
  if (!value || value === "none") {
    return null;
  }

  if (value === "currentColor") {
    return "#000000";
  }

  return value;
};

export const parsePolylinePoints = (pointsAttribute: string): Array<[number, number]> => {
  const tokens = pointsAttribute
    .trim()
    .split(/[\s,]+/u)
    .map(Number)
    .filter((value) => Number.isFinite(value));

  const pairs: Array<[number, number]> = [];

  for (let index = 0; index + 1 < tokens.length; index += 2) {
    pairs.push([tokens[index], tokens[index + 1]]);
  }

  return pairs;
};

export const parseSvgLength = (value: string | null, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
};
