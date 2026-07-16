/** Git clone installer for pinned validator commits. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import readline from "node:readline";
import {
  ChecksumMismatchError,
  InstallCancelledError,
  NetworkError,
} from "./errors.js";
import type { RegistryEntry } from "./registry.js";

export type GitCloneFn = (repo: string, commit: string, dest: string) => void | Promise<void>;

export function defaultCacheDir(): string {
  if (process.env.GALYA_CACHE_DIR) {
    return path.resolve(process.env.GALYA_CACHE_DIR);
  }
  return path.join(os.homedir(), ".cache", "galya-reality");
}

export function installPath(name: string, commit: string, cacheDir?: string): string {
  return path.join(cacheDir ?? defaultCacheDir(), name, commit);
}

function readHead(dir: string): string {
  const marker = path.join(dir, ".git", "HEAD_SHA");
  if (fs.existsSync(marker)) {
    return fs.readFileSync(marker, "utf8").trim();
  }
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: dir,
    encoding: "utf8",
  });
  if (result.status !== 0) return "";
  return (result.stdout ?? "").trim();
}

async function confirmInstall(name: string, entry: RegistryEntry): Promise<void> {
  if (process.env.GALYA_AUTO_INSTALL === "1") return;

  const prompt =
    `Install validator '${name}' from\n` +
    `  repo:   ${entry.repo}\n` +
    `  commit: ${entry.commit}\n` +
    `? [y/N] `;

  // Non-interactive environments: refuse unless AUTO_INSTALL
  if (!process.stdin.isTTY) {
    throw new InstallCancelledError(name);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question(prompt, (a) => {
      rl.close();
      resolve((a ?? "").trim().toLowerCase());
    });
  });
  if (answer !== "y" && answer !== "yes") {
    throw new InstallCancelledError(name);
  }
}

function defaultGitClone(repo: string, commit: string, dest: string): void {
  const clone = spawnSync(
    "git",
    ["clone", "--filter=blob:none", repo, dest],
    { encoding: "utf8" },
  );
  if (clone.status !== 0) {
    throw new Error(clone.stderr || "git clone failed");
  }
  const checkout = spawnSync("git", ["checkout", commit], {
    cwd: dest,
    encoding: "utf8",
  });
  if (checkout.status !== 0) {
    throw new Error(checkout.stderr || "git checkout failed");
  }
}

export async function ensureInstalled(
  name: string,
  entry: RegistryEntry,
  opts?: {
    cacheDir?: string;
    gitClone?: GitCloneFn;
    confirm?: boolean;
  },
): Promise<string> {
  const commit = entry.commit;
  const dest = installPath(name, commit, opts?.cacheDir);

  if (fs.existsSync(path.join(dest, ".git"))) {
    const actual = readHead(dest);
    if (actual === commit) return dest;
    fs.rmSync(dest, { recursive: true, force: true });
  }

  if (opts?.confirm !== false) {
    await confirmInstall(name, entry);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const cloneFn = opts?.gitClone ?? defaultGitClone;
  try {
    await cloneFn(entry.repo, commit, dest);
  } catch (err) {
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    throw new NetworkError(`git clone failed for '${name}': ${String(err)}`);
  }

  if (!fs.existsSync(path.join(dest, ".git"))) {
    fs.mkdirSync(path.join(dest, ".git"), { recursive: true });
    fs.writeFileSync(path.join(dest, ".git", "HEAD_SHA"), commit, "utf8");
  } else {
    const actual = readHead(dest);
    if (actual && actual !== commit) {
      fs.rmSync(dest, { recursive: true, force: true });
      throw new ChecksumMismatchError(name, commit, actual);
    }
  }

  return dest;
}

export function verifyChecksum(name: string, dir: string, expected: string): void {
  const actual = readHead(dir);
  if (actual !== expected) {
    throw new ChecksumMismatchError(name, expected, actual);
  }
}
