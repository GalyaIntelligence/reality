/** Client: resolve a single validator by name and wrap index/judge. */

import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import type { ContextWindow, Message, ValidationResult, Validator } from "./base.js";
import { EntrypointError, LanguageNotSupportedError } from "./errors.js";
import { ensureInstalled, type GitCloneFn } from "./installer.js";
import {
  availableLanguages,
  loadRegistry,
  resolve,
  type Registry,
  type RegistryEntry,
} from "./registry.js";
import { smokeTest } from "./sandbox.js";

const clients = new Map<string, ValidatorClient>();

export class ValidatorClient {
  readonly name: string;
  readonly latencyClass: string;
  private readonly impl: Validator;
  private readonly entry: RegistryEntry;

  constructor(name: string, impl: Validator, entry: RegistryEntry) {
    this.name = name;
    this.impl = impl;
    this.entry = entry;
    this.latencyClass = impl.latencyClass ?? entry.latency_class;
  }

  async index(message: Message, context: ContextWindow): Promise<void> {
    await this.impl.index(message, context);
  }

  async judge(message: Message, context: ContextWindow): Promise<ValidationResult> {
    const result = await this.impl.judge(message, context);
    if (
      typeof result !== "object" ||
      result === null ||
      typeof (result as ValidationResult).score !== "number"
    ) {
      throw new EntrypointError(
        this.name,
        `judge() returned unexpected value: ${String(result)}`,
      );
    }
    return result as ValidationResult;
  }
}

async function resolveModuleFile(dir: string, modulePath: string): Promise<string> {
  const candidates = [
    path.join(dir, modulePath),
    path.join(dir, `${modulePath}.ts`),
    path.join(dir, `${modulePath}.js`),
    path.join(dir, modulePath.replace(/\.ts$/, ".js")),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  throw new Error(`module file not found for entrypoint module '${modulePath}' in ${dir}`);
}

async function loadImpl(dir: string, entrypoint: string, name: string): Promise<Validator> {
  const [modulePath, className] = entrypoint.split(":");
  if (!modulePath || !className) {
    throw new EntrypointError(name, `invalid entrypoint '${entrypoint}'`);
  }
  try {
    const file = await resolveModuleFile(dir, modulePath);
    const mod = await import(pathToFileURL(file).href);
    const Cls = mod[className] ?? mod.default?.[className] ?? mod.default;
    if (typeof Cls !== "function") {
      throw new Error(`class not found: ${className}`);
    }
    const inst = new Cls() as Validator;
    if (!inst.name) throw new Error("missing name");
    if (!inst.latencyClass) throw new Error("missing latencyClass");
    if (typeof inst.index !== "function") throw new Error("missing index");
    if (typeof inst.judge !== "function") throw new Error("missing judge");
    if (!["inline", "async"].includes(inst.latencyClass)) {
      throw new Error(`invalid latencyClass: ${String(inst.latencyClass)}`);
    }
    return inst;
  } catch (err) {
    throw new EntrypointError(name, String(err));
  }
}

export interface ValidatorOptions {
  registry?: Registry;
  cacheDir?: string;
  gitClone?: GitCloneFn;
  confirm?: boolean;
  skipSmoke?: boolean;
}

/**
 * Resolve `name` against the registry and return a singleton client.
 * One validator per client — no multi-name fan-out.
 */
export async function validator(
  name: string,
  opts: ValidatorOptions = {},
): Promise<ValidatorClient> {
  const useDefaultPath =
    opts.registry === undefined &&
    opts.gitClone === undefined &&
    opts.cacheDir === undefined;

  if (useDefaultPath && clients.has(name)) {
    return clients.get(name)!;
  }

  const registry = opts.registry ?? (await loadRegistry());
  const entry = resolve(name, registry);
  const langs = availableLanguages(entry);
  if (!langs.includes("ts")) {
    throw new LanguageNotSupportedError(name, langs, "ts");
  }

  const entrypoint = entry.entrypoints.ts!;
  const dir = await ensureInstalled(name, entry, {
    cacheDir: opts.cacheDir,
    gitClone: opts.gitClone,
    confirm: opts.confirm,
  });

  if (!opts.skipSmoke) {
    smokeTest(dir, entrypoint, name);
  }

  const impl = await loadImpl(dir, entrypoint, name);
  const client = new ValidatorClient(name, impl, entry);

  if (useDefaultPath) {
    clients.set(name, client);
  }
  return client;
}

/** Test helper: clear the in-process singleton cache. */
export function _resetClients(): void {
  clients.clear();
}

export function _getClients(): Map<string, ValidatorClient> {
  return clients;
}
