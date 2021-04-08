import index from ".";

describe("index", () => {
  it("should be exported", () => {
    expect(typeof index === "function").toBe(true);
  });
});
