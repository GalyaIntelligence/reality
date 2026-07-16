import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validator } from "../src/client.js";
import { BOTH, cloneFromFixture, makeRegistry, resetClients } from "./helpers.js";

describe("client index/judge", () => {
  let cacheDir: string;
  const registry = makeRegistry();

  beforeEach(() => {
    resetClients();
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "galya-cache-"));
  });

  it("awaits index and returns ValidationResult for sync judge", async () => {
    const client = await validator("sync-judge", {
      registry,
      cacheDir,
      confirm: false,
      skipSmoke: true,
      gitClone: cloneFromFixture(BOTH),
    });
    const message = { role: "user", content: "hello" };
    const context = { messages: [message] };
    await client.index(message, context);
    const result = await client.judge(message, context);
    expect(result.score).toBeCloseTo(0.42);
    expect(result.label).toBe("sync");
  });

  it("handles async judge", async () => {
    const client = await validator("async-judge", {
      registry,
      cacheDir,
      confirm: false,
      skipSmoke: true,
      gitClone: cloneFromFixture(BOTH),
    });
    const message = { role: "user", content: "hi" };
    const result = await client.judge(message, { messages: [message] });
    expect(result.score).toBeCloseTo(0.88);
    expect(result.label).toBe("async");
  });

  it("resolves both-languages fixture", async () => {
    const client = await validator("fake-both", {
      registry,
      cacheDir,
      confirm: false,
      skipSmoke: true,
      gitClone: cloneFromFixture(BOTH),
    });
    const message = { role: "user", content: "x".repeat(50) };
    const result = await client.judge(message, { messages: [message] });
    expect(result.score).toBeCloseTo(0.5);
    expect(result.label).toBe("ok");
  });
});
