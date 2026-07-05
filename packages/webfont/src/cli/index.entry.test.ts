const { startCli } = vi.hoisted(() => ({
  startCli: vi.fn(),
}));

vi.mock("./program", () => ({
  startCli,
}));

vi.mock("./meow", () => ({
  __esModule: true,
  default: {
    flags: {},
    input: [],
    showHelp: vi.fn(),
    showVersion: vi.fn(),
  },
}));

describe("cli entrypoint", () => {
  it("should wire the meow parser into startCli on load", async () => {
    vi.resetModules();
    await import("./index");

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
