#!/usr/bin/env python3
"""Quick smoke: both-lang resolve + LanguageNotSupportedError."""

from pathlib import Path
import shutil

from galya_reality.client import validator
from galya_reality.exceptions import LanguageNotSupportedError

ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "packages/python/tests/fixtures/fake_validator_repo_both"
cache = Path("/tmp/galya-demo-cache")

reg = {
    "fake-both": {
        "repo": "file:///fake",
        "commit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "entrypoints": {
            "python": "validator:FakeBothValidator",
            "ts": "validator.js:FakeBothValidator",
        },
        "latency_class": "inline",
        "maintainer": "@t",
        "status": "both",
        "parity_fixture": "x.json",
    },
    "fake-ts-only": {
        "repo": "file:///fake",
        "commit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "entrypoints": {"ts": "validator.js:X"},
        "latency_class": "inline",
        "maintainer": "@t",
        "status": "ts-only",
    },
}


def clone(_repo, commit, dest):
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    (dest / ".git").mkdir(parents=True, exist_ok=True)
    (dest / ".git" / "HEAD_SHA").write_text(commit)


def main() -> None:
    c = validator(
        "fake-both",
        registry=reg,
        cache_dir=cache,
        git_clone=clone,
        confirm=False,
        skip_smoke=True,
    )
    print("both-ok", c.name)
    try:
        validator(
            "fake-ts-only",
            registry=reg,
            cache_dir=cache,
            git_clone=clone,
            confirm=False,
            skip_smoke=True,
        )
    except LanguageNotSupportedError as e:
        print("lang-gate-ok", e)


if __name__ == "__main__":
    main()
