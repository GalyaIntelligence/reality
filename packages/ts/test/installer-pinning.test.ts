import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensureInstalled, verifyChecksum } from "../src/installer.js";
import { ChecksumMismatchError } from "../src/errors.js";
import { BOTH, PIN, cloneFromFixture, makeRegistry, resetClients } from "./helpers.js";

describe("installer pinning", () => {
  let cacheDir: string;

  beforeEach(() => {
    resetClients();
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "galya-cache-"));
  });

  it("clones the pinned commit", async () => {
    const calls: Array<[string, string]> = [];
    const entry = makeRegistry()["fake-both"];
    const dest = await ensureInstalled("fake-both", entry, {
      cacheDir,
      confirm: false,
      gitClone: (repo, commit, d) => {
        calls.push([repo, commit]);
        cloneFromFixture(BOTH)(repo, commit, d);
      },
    });
    expect(calls).toEqual([["file:///fake/both", PIN]]);
    expect(dest).toBe(path.join(cacheDir, "fake-both", PIN));
    expect(fs.existsSync(dest)).toBe(true);
  });

  it("reuses cache and does not re-clone", async () => {
    let calls = 0;
    const entry = makeRegistry()["fake-both"];
    const clone = (repo: string, commit: string, d: string) => {
      calls += 1;
      cloneFromFixture(BOTH)(repo, commit, d);
    };
    await ensureInstalled("fake-both", entry, { cacheDir, confirm: false, gitClone: clone });
    await ensureInstalled("fake-both", entry, { cacheDir, confirm: false, gitClone: clone });
    expect(calls).toBe(1);
  });

  it("raises on checksum mismatch", async () => {
    const entry = makeRegistry()["fake-both"];
    const dest = await ensureInstalled("fake-both", entry, {
      cacheDir,
      confirm: false,
      gitClone: cloneFromFixture(BOTH),
    });
    fs.writeFileSync(path.join(dest, ".git", "HEAD_SHA"), "deadbeef".repeat(5));
    expect(() => verifyChecksum("fake-both", dest, entry.commit)).toThrow(
      ChecksumMismatchError,
    );
  });
});
