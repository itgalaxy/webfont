const startCli = jest.fn();

jest.mock("./program", () => ({
  startCli,
}));

jest.mock("./meow", () => ({
  __esModule: true,
  default: {
    flags: {},
    input: [],
    showHelp: jest.fn(),
    showVersion: jest.fn(),
  },
}));

describe("cli entrypoint", () => {
  it("should wire the meow parser into startCli on load", () => {
    jest.isolateModules(() => {
      // biome-ignore lint/style/noCommonJs: isolateModules needs synchronous require
      require("./index");
    });

    expect(startCli).toHaveBeenCalledWith(
      expect.objectContaining({
        flags: expect.any(Object),
        input: expect.any(Array),
        showHelp: expect.any(Function),
        showVersion: expect.any(Function),
      }),
    );
  });
});
