#!/usr/bin/env python3
"""Validate registry/index.json against schema.json and semantic language rules."""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    print("Install jsonschema: pip install jsonschema", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "registry" / "index.json"
SCHEMA = ROOT / "registry" / "schema.json"


def status_for(entrypoints: dict) -> str:
    has_py = bool(entrypoints.get("python"))
    has_ts = bool(entrypoints.get("ts"))
    if has_py and has_ts:
        return "both"
    if has_py:
        return "python-only"
    if has_ts:
        return "ts-only"
    raise ValueError("entrypoints must include at least one of python/ts")


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    jsonschema.validate(instance=index, schema=schema)

    errors: list[str] = []
    for name, entry in index.items():
        eps = entry.get("entrypoints") or {}
        if not eps.get("python") and not eps.get("ts"):
            errors.append(f"{name}: entrypoints must include at least one of python/ts")
            continue

        expected = status_for(eps)
        actual = entry.get("status")
        if actual != expected:
            errors.append(
                f"{name}: status must be {expected!r} to match entrypoints, got {actual!r}"
            )

        both = bool(eps.get("python")) and bool(eps.get("ts"))
        if both and not entry.get("parity_fixture"):
            errors.append(f"{name}: parity_fixture required when both entrypoints present")
        if not both and entry.get("parity_fixture"):
            errors.append(
                f"{name}: parity_fixture must be omitted when only one language is present"
            )

        commit = entry.get("commit", "")
        if not isinstance(commit, str) or len(commit) != 40 or any(
            c not in "0123456789abcdef" for c in commit
        ):
            errors.append(f"{name}: commit must be a full 40-char lowercase hex SHA")

    if errors:
        print("Registry validation failed:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print(f"OK: validated {len(index)} registry entr(y/ies)")


if __name__ == "__main__":
    main()
