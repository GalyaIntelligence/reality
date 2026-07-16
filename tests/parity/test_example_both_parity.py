"""Cross-language parity test against the example_both fixture."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
EXAMPLE = REPO_ROOT / "examples" / "write_your_own_validator" / "example_both"
SCRIPT = REPO_ROOT / "scripts" / "parity_check.py"


def test_example_both_parity():
    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--repo-dir",
            str(EXAMPLE),
            "--python-entrypoint",
            "validator:ExampleBothValidator",
            "--ts-entrypoint",
            "validator.js:ExampleBothValidator",
            "--fixture",
            "fixtures/parity_case_01.json",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, f"stdout={result.stdout}\nstderr={result.stderr}"
    assert "PARITY OK" in result.stdout
