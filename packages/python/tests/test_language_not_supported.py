"""LanguageNotSupportedError gating — must not attempt clone."""

from __future__ import annotations

import pytest

from galya_reality.client import validator
from galya_reality.exceptions import LanguageNotSupportedError


def test_ts_only_raises_without_cloning(registry, cache_dir, monkeypatch):
    cloned = {"count": 0}

    def boom(repo, commit, dest):
        cloned["count"] += 1
        raise AssertionError("clone must not be attempted for unsupported language")

    with pytest.raises(LanguageNotSupportedError) as exc:
        validator(
            "fake-ts-only",
            registry=registry,
            cache_dir=cache_dir,
            git_clone=boom,
            confirm=False,
            skip_smoke=True,
        )

    assert "ts" in str(exc.value)
    assert "python" in str(exc.value).lower() or "Available" in str(exc.value)
    assert cloned["count"] == 0
    assert list(cache_dir.iterdir()) == []
