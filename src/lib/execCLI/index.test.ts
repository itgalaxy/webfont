const { mockExec } = vi.hoisted(() => ({
  mockExec: vi.fn(),
}));

vi.mock("child_process", () => ({
  exec: mockExec,
}));

import { exec } from "child_process";
import fs from "fs";
import { execCLI } from "./index";

const mockedExec = vi.mocked(exec);

describe("execCLI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject when destination readdir fails", async () => {
    const readdirError = Object.assign(new Error("readdir failed"), { code: "ENOENT" });
    const readdirSpy = vi.spyOn(fs, "readdir").mockImplementation((_destination, _encoding, callback) => {
      (callback as unknown as (error: NodeJS.ErrnoException | null, files: string[]) => void)(readdirError, []);
      return undefined as never;
    });

    mockedExec.mockImplementation((_command, _options, callback) => {
      (callback as (error: null, stdout: string, stderr: string) => void)(null, "", "");
      return undefined as never;
    });

    await expect(execCLI("", "temp/missing-cli-destination")).rejects.toThrow("readdir failed");

    readdirSpy.mockRestore();
  });
});
