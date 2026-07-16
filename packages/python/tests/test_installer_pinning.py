"""Installer pinning and cache reuse."""

from __future__ import annotations

from pathlib import Path

import pytest

from conftest import BOTH, PIN, clone_from_fixture
from galya_reality.exceptions import ChecksumMismatchError
from galya_reality.installer import ensure_installed, verify_checksum


def test_pinned_commit_cloned(registry, cache_dir):
    calls: list[tuple[str, str]] = []

    def tracking_clone(repo, commit, dest):
        calls.append((repo, commit))
        clone_from_fixture(BOTH)(repo, commit, dest)

    entry = registry["fake-both"]
    path = ensure_installed(
        "fake-both",
        entry,
        cache_dir=cache_dir,
        git_clone=tracking_clone,
        confirm=False,
    )
    assert calls == [("file:///fake/both", PIN)]
    assert path == cache_dir / "fake-both" / PIN
    assert path.is_dir()


def test_cache_reuse_skips_reclone(registry, cache_dir):
    calls: list[int] = []

    def tracking_clone(repo, commit, dest):
        calls.append(1)
        clone_from_fixture(BOTH)(repo, commit, dest)

    entry = registry["fake-both"]
    ensure_installed(
        "fake-both", entry, cache_dir=cache_dir, git_clone=tracking_clone, confirm=False
    )
    ensure_installed(
        "fake-both", entry, cache_dir=cache_dir, git_clone=tracking_clone, confirm=False
    )
    assert len(calls) == 1


def test_checksum_mismatch_raises(registry, cache_dir):
    entry = dict(registry["fake-both"])
    path = ensure_installed(
        "fake-both",
        entry,
        cache_dir=cache_dir,
        git_clone=clone_from_fixture(BOTH),
        confirm=False,
    )
    # Corrupt the recorded SHA
    (path / ".git" / "HEAD_SHA").write_text("deadbeef" * 5, encoding="utf-8")
    with pytest.raises(ChecksumMismatchError):
        verify_checksum("fake-both", path, entry["commit"])
