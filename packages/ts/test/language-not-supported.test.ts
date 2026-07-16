import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validator } from "../src/client.js";
import { LanguageNotSupportedError } from "../src/errors.js";
import { makeRegistry, resetClients } from "./helpers.js";

describe("language not supported", () => {
  let cacheDir: string;

  beforeEach(() => {
    resetClients();
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "galya-cache-"));
  });

  it("raises for python-only without cloning", async () => {
    let clones = 0;
    await expect(
      validator("fake-python-only", {
        registry: makeRegistry(),
        cacheDir,
        confirm: false,
        skipSmoke: true,
        gitClone: () => {
          clones += 1;
          throw new Error("must not clone");
        },
      }),
    ).rejects.toBeInstanceOf(LanguageNotSupportedError);

    expect(clones).toBe(0);
    expect(fs.readdirSync(cacheDir)).toEqual([]);
  });
});
