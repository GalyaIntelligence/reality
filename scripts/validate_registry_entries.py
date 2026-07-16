#!/usr/bin/env python3
"""Clone changed registry entries and sandbox-import (+ parity when both langs)."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "registry" / "index.json"
PARITY = ROOT / "scripts" / "parity_check.py"


def _changed_names() -> set[str] | None:
    """Return names added/changed vs base, or None to check all entries."""
    base = os.environ.get("GITHUB_BASE_SHA") or os.environ.get("GALYA_BASE_SHA")
    if not base:
        return None
    try:
        result = subprocess.run(
            ["git", "show", f"{base}:registry/index.json"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            return None
        old = json.loads(result.stdout or "{}")
    except Exception:  # noqa: BLE001
        return None
    new = json.loads(INDEX.read_text(encoding="utf-8"))
    changed = set()
    for name, entry in new.items():
        if name not in old or old[name] != entry:
            changed.add(name)
    return changed


def _clone(repo: str, commit: str, dest: Path) -> None:
    subprocess.run(
        ["git", "clone", "--filter=blob:none", repo, str(dest)],
        check=True,
        capture_output=True,
        text=True,
    )
    subprocess.run(
        ["git", "checkout", commit],
        cwd=dest,
        check=True,
        capture_output=True,
        text=True,
    )


def _smoke_python(dest: Path, entrypoint: str) -> None:
    module_name, _, class_name = entrypoint.partition(":")
    script = f"""
import sys, importlib
sys.path.insert(0, {str(dest)!r})
mod = importlib.import_module({module_name!r})
cls = getattr(mod, {class_name!r})
inst = cls()
assert getattr(inst, "name", None), "missing name"
assert getattr(inst, "latency_class", None) in ("inline", "async")
assert callable(getattr(inst, "index", None))
assert callable(getattr(inst, "judge", None))
print("OK")
"""
    result = subprocess.run([sys.executable, "-c", script], capture_output=True, text=True)
    if result.returncode != 0 or "OK" not in result.stdout:
        raise RuntimeError(result.stderr or result.stdout)


def _smoke_ts(dest: Path, entrypoint: str) -> None:
    module_path, _, class_name = entrypoint.partition(":")
    script = f"""
import {{ pathToFileURL }} from "node:url";
import path from "node:path";
import fs from "node:fs";
const dir = {str(dest)!r};
let file = path.join(dir, {module_path!r});
if (!fs.existsSync(file)) {{
  for (const ext of [".js", ".mjs", ".ts"]) {{
    if (fs.existsSync(file + ext)) {{ file = file + ext; break; }}
  }}
}}
const mod = await import(pathToFileURL(file).href);
const Cls = mod[{class_name!r}] ?? mod.default;
const inst = new Cls();
if (!inst.name) throw new Error("missing name");
if (!["inline", "async"].includes(inst.latencyClass)) throw new Error("bad latencyClass");
if (typeof inst.index !== "function") throw new Error("missing index");
if (typeof inst.judge !== "function") throw new Error("missing judge");
console.log("OK");
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or "OK" not in result.stdout:
        raise RuntimeError(result.stderr or result.stdout)


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    if not index:
        print("OK: empty registry, nothing to sandbox")
        return

    changed = _changed_names()
    targets = list(index.keys()) if changed is None else sorted(changed)
    if not targets:
        print("OK: no registry entry changes to sandbox")
        return

    tmp = Path(tempfile.mkdtemp(prefix="galya-registry-"))
    try:
        for name in targets:
            entry = index[name]
            print(f"==> {name}")
            dest = tmp / name
            _clone(entry["repo"], entry["commit"], dest)
            eps = entry["entrypoints"]
            if eps.get("python"):
                print(f"  smoke python: {eps['python']}")
                _smoke_python(dest, eps["python"])
            if eps.get("ts"):
                print(f"  smoke ts: {eps['ts']}")
                _smoke_ts(dest, eps["ts"])
            if eps.get("python") and eps.get("ts"):
                fixture = entry["parity_fixture"]
                print(f"  parity: {fixture}")
                subprocess.run(
                    [
                        sys.executable,
                        str(PARITY),
                        "--repo-dir",
                        str(dest),
                        "--python-entrypoint",
                        eps["python"],
                        "--ts-entrypoint",
                        eps["ts"],
                        "--fixture",
                        fixture,
                    ],
                    check=True,
                )
        print(f"OK: sandboxed {len(targets)} entr(y/ies)")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
