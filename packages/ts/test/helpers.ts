import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Registry } from "../src/registry.js";
import { _resetClients } from "../src/client.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES = path.join(here, "fixtures");
export const BOTH = path.join(FIXTURES, "fake-validator-repo-both");
export const TS_ONLY = path.join(FIXTURES, "fake-validator-repo-ts-only");

export const PIN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
export const PIN_PY = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

export function makeRegistry(): Registry {
  return {
    "fake-both": {
      repo: "file:///fake/both",
      commit: PIN,
      entrypoints: {
        python: "validator:FakeBothValidator",
        ts: "validator.js:FakeBothValidator",
      },
      latency_class: "inline",
      maintainer: "@test",
      status: "both",
      parity_fixture: "fixtures/parity_case_01.json",
    },
    "fake-ts-only": {
      repo: "file:///fake/ts-only",
      commit: PIN,
      entrypoints: {
        ts: "validator.js:FakeTsOnlyValidator",
      },
      latency_class: "inline",
      maintainer: "@test",
      status: "ts-only",
    },
    "fake-python-only": {
      repo: "file:///fake/python-only",
      commit: PIN_PY,
      entrypoints: {
        python: "validator:FakePythonOnlyValidator",
      },
      latency_class: "inline",
      maintainer: "@test",
      status: "python-only",
    },
    "sync-judge": {
      repo: "file:///fake/both",
      commit: PIN,
      entrypoints: {
        ts: "validator.js:SyncJudgeValidator",
      },
      latency_class: "inline",
      maintainer: "@test",
      status: "ts-only",
    },
    "async-judge": {
      repo: "file:///fake/both",
      commit: PIN,
      entrypoints: {
        ts: "validator.js:AsyncJudgeValidator",
      },
      latency_class: "async",
      maintainer: "@test",
      status: "ts-only",
    },
  };
}

export function cloneFromFixture(src: string) {
  return (repo: string, commit: string, dest: string) => {
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });
    fs.mkdirSync(path.join(dest, ".git"), { recursive: true });
    fs.writeFileSync(path.join(dest, ".git", "HEAD_SHA"), commit, "utf8");
  };
}

export function resetClients(): void {
  _resetClients();
}
