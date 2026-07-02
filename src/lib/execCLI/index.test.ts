import { exec } from "child_process";
import fs from "fs";
import { execCLI } from "./index";

jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

const mockedExec = exec as jest.MockedFunction<typeof exec>;

describe("execCLI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject when destination readdir fails", async () => {
    const readdirError = Object.assign(new Error("readdir failed"), { code: "ENOENT" });
    const readdirSpy = jest.spyOn(fs, "readdir").mockImplementation((_destination, _encoding, callback) => {
      (callback as (error: NodeJS.ErrnoException | null, files: string[]) => void)(readdirError, []);
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
