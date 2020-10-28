import index from "..";

describe("index", () => {
  it("should exported", () => {
    expect(typeof index === "function").toBe(true);
  });
});
