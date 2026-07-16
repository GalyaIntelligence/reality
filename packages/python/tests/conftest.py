"""Shared pytest fixtures and helpers."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest

from galya_reality.client import _reset_clients

FIXTURES = Path(__file__).parent / "fixtures"
BOTH = FIXTURES / "fake_validator_repo_both"
PYTHON_ONLY = FIXTURES / "fake_validator_repo_python_only"

PIN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
PIN_TS = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"


def make_registry() -> dict:
    return {
        "fake-both": {
            "repo": "file:///fake/both",
            "commit": PIN,
            "entrypoints": {
                "python": "validator:FakeBothValidator",
                "ts": "validator.ts:FakeBothValidator",
            },
            "latency_class": "inline",
            "maintainer": "@test",
            "status": "both",
            "parity_fixture": "fixtures/parity_case_01.json",
        },
        "fake-python-only": {
            "repo": "file:///fake/python-only",
            "commit": PIN,
            "entrypoints": {
                "python": "validator:FakePythonOnlyValidator",
            },
            "latency_class": "inline",
            "maintainer": "@test",
            "status": "python-only",
        },
        "fake-ts-only": {
            "repo": "file:///fake/ts-only",
            "commit": PIN_TS,
            "entrypoints": {
                "ts": "validator.ts:FakeTsOnlyValidator",
            },
            "latency_class": "inline",
            "maintainer": "@test",
            "status": "ts-only",
        },
        "sync-judge": {
            "repo": "file:///fake/both",
            "commit": PIN,
            "entrypoints": {
                "python": "async_validators:SyncJudgeValidator",
            },
            "latency_class": "inline",
            "maintainer": "@test",
            "status": "python-only",
        },
        "async-judge": {
            "repo": "file:///fake/both",
            "commit": PIN,
            "entrypoints": {
                "python": "async_validators:AsyncJudgeValidator",
            },
            "latency_class": "async",
            "maintainer": "@test",
            "status": "python-only",
        },
    }


def clone_from_fixture(src: Path):
    """Return a git_clone callable that copies ``src`` into dest and pins SHA."""

    def _clone(repo: str, commit: str, dest: Path) -> None:
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(src, dest)
        git_dir = dest / ".git"
        git_dir.mkdir(parents=True, exist_ok=True)
        (git_dir / "HEAD_SHA").write_text(commit, encoding="utf-8")

    return _clone


@pytest.fixture(autouse=True)
def _clear_singletons():
    _reset_clients()
    yield
    _reset_clients()


@pytest.fixture
def registry():
    return make_registry()


@pytest.fixture
def cache_dir(tmp_path: Path) -> Path:
    d = tmp_path / "cache"
    d.mkdir()
    return d
