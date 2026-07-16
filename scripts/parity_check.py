#!/usr/bin/env python3
"""Cross-language parity check for dual-entrypoint validators.

Used by:
- tests/parity/ (local monorepo fixture)
- .github/workflows/validate-registry-pr.yml (real submissions)

Usage:
  python scripts/parity_check.py \\
    --repo-dir /path/to/cloned/validator \\
    --python-entrypoint validator:MyValidator \\
    --ts-entrypoint validator.ts:MyValidator \\
    --fixture fixtures/parity_case_01.json
"""

from __future__ import annotations

import argparse
import asyncio
import importlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


def _load_fixture(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _run_python_judge(repo_dir: Path, entrypoint: str, fixture: dict[str, Any]) -> dict[str, Any]:
    module_name, _, class_name = entrypoint.partition(":")
    sys.path.insert(0, str(repo_dir))
    try:
        mod = importlib.import_module(module_name)
        cls = getattr(mod, class_name)
        inst = cls()

        # Lightweight stand-ins so templates don't need pydantic
        class Msg:
            def __init__(self, d: dict):
                self.role = d["role"]
                self.content = d["content"]
                self.metadata = d.get("metadata") or {}

        class Ctx:
            def __init__(self, d: dict):
                self.messages = [Msg(m) for m in d.get("messages", [])]
                self.metadata = d.get("metadata") or {}

        message = Msg(fixture["message"])
        context = Ctx(fixture.get("context") or {"messages": [fixture["message"]]})

        result = inst.judge(message, context)
        if asyncio.iscoroutine(result):
            result = asyncio.run(result)

        if hasattr(result, "model_dump"):
            return result.model_dump()
        if isinstance(result, dict):
            return result
        return {
            "score": float(result.score),
            "label": getattr(result, "label", None),
            "rationale": getattr(result, "rationale", None),
        }
    finally:
        if str(repo_dir) in sys.path:
            sys.path.remove(str(repo_dir))


def _run_ts_judge(repo_dir: Path, entrypoint: str, fixture: dict[str, Any]) -> dict[str, Any]:
    module_path, _, class_name = entrypoint.partition(":")
    fixture_json = json.dumps(fixture)
    script = f"""
import {{ pathToFileURL }} from "node:url";
import path from "node:path";
import fs from "node:fs";

const dir = {json.dumps(str(repo_dir))};
const modulePath = {json.dumps(module_path)};
const className = {json.dumps(class_name)};
const fixture = {fixture_json};

let file = path.join(dir, modulePath);
if (!fs.existsSync(file)) {{
  for (const ext of [".js", ".mjs", ".ts"]) {{
    if (fs.existsSync(file + ext)) {{ file = file + ext; break; }}
    if (modulePath.endsWith(ext)) break;
  }}
}}
const mod = await import(pathToFileURL(file).href);
const Cls = mod[className] ?? mod.default;
const inst = new Cls();
const message = fixture.message;
const context = fixture.context ?? {{ messages: [message] }};
let result = inst.judge(message, context);
if (result && typeof result.then === "function") result = await result;
console.log(JSON.stringify(result));
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"TS judge failed: {result.stderr or result.stdout}")
    lines = [ln for ln in result.stdout.strip().splitlines() if ln.strip()]
    return json.loads(lines[-1])


def _compare(py: dict[str, Any], ts: dict[str, Any], tolerance: float) -> None:
    py_score = float(py["score"])
    ts_score = float(ts["score"])
    if abs(py_score - ts_score) > tolerance:
        raise SystemExit(
            f"PARITY FAIL: score mismatch python={py_score} ts={ts_score} "
            f"(tolerance={tolerance})"
        )
    py_label = py.get("label")
    ts_label = ts.get("label")
    if py_label is not None or ts_label is not None:
        if py_label != ts_label:
            raise SystemExit(
                f"PARITY FAIL: label mismatch python={py_label!r} ts={ts_label!r}"
            )
    print(f"PARITY OK: score={py_score} label={py_label!r}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Galya cross-language parity check")
    parser.add_argument("--repo-dir", required=True, type=Path)
    parser.add_argument("--python-entrypoint", required=True)
    parser.add_argument("--ts-entrypoint", required=True)
    parser.add_argument("--fixture", required=True, type=Path)
    args = parser.parse_args()

    repo_dir = args.repo_dir.resolve()
    fixture_path = args.fixture if args.fixture.is_absolute() else repo_dir / args.fixture
    fixture = _load_fixture(fixture_path)
    tolerance = float((fixture.get("expect") or {}).get("score_tolerance", 0.01))

    py_result = _run_python_judge(repo_dir, args.python_entrypoint, fixture)
    ts_result = _run_ts_judge(repo_dir, args.ts_entrypoint, fixture)
    _compare(py_result, ts_result, tolerance)


if __name__ == "__main__":
    main()
