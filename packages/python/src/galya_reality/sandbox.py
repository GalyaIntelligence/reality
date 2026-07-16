"""Sandbox: subprocess smoke-test before first real use of a validator."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from galya_reality.exceptions import EntrypointError


_SMOKE_SCRIPT = """
import importlib
import sys
sys.path.insert(0, {path!r})
module_name, _, class_name = {entrypoint!r}.partition(":")
mod = importlib.import_module(module_name)
cls = getattr(mod, class_name)
inst = cls()
assert hasattr(inst, "name"), "missing name"
assert hasattr(inst, "latency_class"), "missing latency_class"
assert callable(getattr(inst, "index", None)), "missing index"
assert callable(getattr(inst, "judge", None)), "missing judge"
assert inst.latency_class in ("inline", "async"), f"bad latency_class: {{inst.latency_class!r}}"
print("OK")
"""


def smoke_test(path: Path, entrypoint: str, name: str) -> None:
    """Import the entrypoint in a subprocess and verify the Validator interface."""
    script = _SMOKE_SCRIPT.format(path=str(path), entrypoint=entrypoint)
    result = subprocess.run(
        [sys.executable, "-c", script],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0 or "OK" not in result.stdout:
        detail = (result.stderr or result.stdout or "smoke test failed").strip()
        raise EntrypointError(name, detail)
