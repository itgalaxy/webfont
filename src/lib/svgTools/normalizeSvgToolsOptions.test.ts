import { normalizeSvgToolsOptions } from "./normalizeSvgToolsOptions";

describe("normalizeSvgToolsOptions", () => {
  it("should return undefined when diagnose is off", () => {
    expect(normalizeSvgToolsOptions({ diagnose: false })).toBeUndefined();
    expect(normalizeSvgToolsOptions(undefined)).toBeUndefined();
  });

  it("should preserve diagnose-only options", () => {
    expect(normalizeSvgToolsOptions({ diagnose: true })).toEqual({ diagnose: true });
  });

  it("should preserve onMessage when diagnose is enabled", () => {
    const onMessage = vi.fn();

    expect(normalizeSvgToolsOptions({ diagnose: true, onMessage })).toEqual({
      diagnose: true,
      onMessage,
    });
  });
});
