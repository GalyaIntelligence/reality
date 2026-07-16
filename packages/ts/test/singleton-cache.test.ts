import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validator, _resetClients, _getClients } from "../src/client.js";
import * as registryMod from "../src/registry.js";
import * as installer from "../src/installer.js";
import * as sandbox from "../src/sandbox.js";
import { BOTH, cloneFromFixture, makeRegistry, resetClients } from "./helpers.js";

const realEnsureInstalled = installer.ensureInstalled;

describe("singleton cache", () => {
  let cacheDir: string;

  beforeEach(() => {
    resetClients();
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "galya-cache-"));
    vi.restoreAllMocks();
  });

  it("returns the same client instance for the same name", async () => {
    const registry = makeRegistry();

    vi.spyOn(registryMod, "loadRegistry").mockResolvedValue(registry);
    vi.spyOn(installer, "ensureInstalled").mockImplementation(async (name, entry) =>
      realEnsureInstalled(name, entry, {
        cacheDir,
        confirm: false,
        gitClone: cloneFromFixture(BOTH),
      }),
    );
    vi.spyOn(sandbox, "smokeTest").mockImplementation(() => undefined);

    _resetClients();
    const first = await validator("fake-both");
    const second = await validator("fake-both");
    expect(first).toBe(second);
    expect(_getClients().has("fake-both")).toBe(true);
  });
});
