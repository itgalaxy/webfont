import crypto from "crypto";
import isEot from "is-eot";
import standalone from "../../standalone";
import convertTtfToEot from "./index";

const fixturesGlob = "src/fixtures/svg-icons/*.svg";

describe("ttf2eot", () => {
  it("should convert a ttf buffer to a valid eot buffer", async () => {
    const { ttf } = await standalone({
      files: fixturesGlob,
      formats: ["ttf"],
    });

    const eot = convertTtfToEot(ttf!);

    expect(isEot(eot)).toBe(true);
    expect(eot.length).toBeGreaterThan(0);
  });

  it("should produce deterministic eot output for fixture icons", async () => {
    const { ttf } = await standalone({
      files: fixturesGlob,
      formats: ["ttf"],
    });

    const hash = crypto.createHash("md5").update(convertTtfToEot(ttf!)).digest("hex");

    expect(hash).toBe("0da1e32d0196eceb273968727af10d99");
  });

  it("should match eot from the standalone eot format pipeline", async () => {
    const { ttf, eot } = await standalone({
      files: fixturesGlob,
      formats: ["ttf", "eot"],
    });

    expect(convertTtfToEot(ttf!)).toEqual(eot);
  });
});
