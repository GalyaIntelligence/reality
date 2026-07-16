/** Registry loading and name resolution. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NetworkError, UnknownValidatorError } from "./errors.js";

export interface Entrypoints {
  python?: string;
  ts?: string;
}

export interface RegistryEntry {
  repo: string;
  commit: string;
  entrypoints: Entrypoints;
  latency_class: "inline" | "async";
  maintainer: string;
  parity_fixture?: string;
  status: "python-only" | "ts-only" | "both";
}

export type Registry = Record<string, RegistryEntry>;

function bundledRegistryPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dataCopy = path.join(here, "..", "data", "index.json");
  if (fs.existsSync(dataCopy)) return dataCopy;
  // packages/ts/src → repo root
  return path.resolve(here, "../../../registry/index.json");
}

function loadJsonFile(filePath: string): Registry {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`Registry must be a JSON object: ${filePath}`);
  }
  return data as Registry;
}

async function fetchRemote(url: string): Promise<Registry> {
  try {
    if (url.startsWith("file://") || (!url.includes("://") && fs.existsSync(url))) {
      const p = url.startsWith("file://") ? fileURLToPath(url) : url;
      return loadJsonFile(p);
    }
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = (await resp.json()) as unknown;
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      throw new Error("remote registry is not a JSON object");
    }
    return data as Registry;
  } catch (err) {
    throw new NetworkError(`failed to fetch registry from ${url}: ${String(err)}`);
  }
}

export async function loadRegistry(opts?: {
  registryUrl?: string | null;
  bundledPath?: string;
}): Promise<Registry> {
  const bundled = loadJsonFile(opts?.bundledPath ?? bundledRegistryPath());
  const merged: Registry = { ...bundled };

  const url =
    opts && "registryUrl" in (opts ?? {})
      ? opts!.registryUrl
      : process.env.GALYA_REGISTRY_URL;

  if (url) {
    const override = await fetchRemote(url);
    Object.assign(merged, override);
  }
  return merged;
}

export function resolve(name: string, registry: Registry): RegistryEntry {
  const entry = registry[name];
  if (!entry) throw new UnknownValidatorError(name);
  return entry;
}

export function availableLanguages(entry: RegistryEntry): string[] {
  const eps = entry.entrypoints ?? {};
  return (["python", "ts"] as const).filter((lang) => Boolean(eps[lang]));
}
