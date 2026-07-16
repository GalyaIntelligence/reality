import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadRegistry, resolve } from "../src/registry.js";
import { UnknownValidatorError } from "../src/errors.js";

describe("registry resolution", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "galya-reg-"));
  });

  it("resolves a known name", async () => {
    const index = {
      "galya-taste": {
        repo: "https://github.com/example/v",
        commit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        entrypoints: { ts: "validator.ts:V" },
        latency_class: "async",
        maintainer: "@x",
        status: "ts-only",
      },
    };
    const p = path.join(tmp, "index.json");
    fs.writeFileSync(p, JSON.stringify(index));
    delete process.env.GALYA_REGISTRY_URL;

    const reg = await loadRegistry({ bundledPath: p, registryUrl: null });
    const entry = resolve("galya-taste", reg);
    expect(entry.repo).toBe("https://github.com/example/v");
    expect(entry.status).toBe("ts-only");
  });

  it("raises for unknown name", async () => {
    const p = path.join(tmp, "index.json");
    fs.writeFileSync(p, "{}");
    const reg = await loadRegistry({ bundledPath: p, registryUrl: null });
    expect(() => resolve("nope", reg)).toThrow(UnknownValidatorError);
  });

  it("GALYA_REGISTRY_URL / registryUrl override takes precedence", async () => {
    const bundled = {
      local: {
        repo: "https://github.com/example/local",
        commit: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        entrypoints: { ts: "a:A" },
        latency_class: "inline",
        maintainer: "@a",
        status: "ts-only",
      },
    };
    const remote = {
      local: {
        repo: "https://github.com/example/remote",
        commit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        entrypoints: { ts: "b:B" },
        latency_class: "async",
        maintainer: "@b",
        status: "ts-only",
      },
      extra: {
        repo: "https://github.com/example/extra",
        commit: "cccccccccccccccccccccccccccccccccccccccc",
        entrypoints: { python: "c:C" },
        latency_class: "inline",
        maintainer: "@c",
        status: "python-only",
      },
    };
    const bundledPath = path.join(tmp, "bundled.json");
    const remotePath = path.join(tmp, "remote.json");
    fs.writeFileSync(bundledPath, JSON.stringify(bundled));
    fs.writeFileSync(remotePath, JSON.stringify(remote));

    const merged = await loadRegistry({
      bundledPath,
      registryUrl: remotePath,
    });
    expect(merged.local.commit).toBe("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    expect(merged.extra.status).toBe("python-only");
  });
});
