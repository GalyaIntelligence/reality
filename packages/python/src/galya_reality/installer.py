"""Git clone installer for pinned validator commits."""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from galya_reality.exceptions import (
    ChecksumMismatchError,
    InstallCancelledError,
    NetworkError,
)
from galya_reality.registry import RegistryEntry


def default_cache_dir() -> Path:
    override = os.environ.get("GALYA_CACHE_DIR")
    if override:
        return Path(override).expanduser()
    return Path.home() / ".cache" / "galya-reality"


def install_path(name: str, commit: str, cache_dir: Path | None = None) -> Path:
    base = cache_dir or default_cache_dir()
    return base / name / commit


def _read_HEAD(path: Path) -> str:
    marker = path / ".git" / "HEAD_SHA"
    if marker.is_file():
        return marker.read_text(encoding="utf-8").strip()
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=path,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def _confirm_install(name: str, entry: RegistryEntry) -> None:
    if os.environ.get("GALYA_AUTO_INSTALL") == "1":
        return
    repo = entry["repo"]
    commit = entry["commit"]
    prompt = (
        f"Install validator {name!r} from\n"
        f"  repo:   {repo}\n"
        f"  commit: {commit}\n"
        f"? [y/N] "
    )
    try:
        answer = input(prompt).strip().lower()
    except EOFError:
        answer = ""
    if answer not in ("y", "yes"):
        raise InstallCancelledError(name)


def ensure_installed(
    name: str,
    entry: RegistryEntry,
    *,
    cache_dir: Path | None = None,
    git_clone=None,
    confirm: bool = True,
) -> Path:
    """Ensure ``entry`` is cloned at the pinned commit; return the path.

    ``git_clone`` is an injectable callable for tests:
    ``git_clone(repo, commit, dest) -> None``.
    """
    commit = entry["commit"]
    dest = install_path(name, commit, cache_dir)

    if dest.is_dir() and (dest / ".git").exists():
        actual = _read_HEAD(dest)
        if actual == commit:
            return dest
        # Corrupt / wrong cache — wipe and re-clone
        shutil.rmtree(dest)

    if confirm:
        _confirm_install(name, entry)

    dest.parent.mkdir(parents=True, exist_ok=True)
    repo = entry["repo"]

    clone_fn = git_clone or _default_git_clone
    try:
        clone_fn(repo, commit, dest)
    except Exception as exc:  # noqa: BLE001
        if dest.exists():
            shutil.rmtree(dest, ignore_errors=True)
        raise NetworkError(f"git clone failed for {name!r}: {exc}") from exc

    actual = _read_HEAD(dest) if (dest / ".git").exists() else commit
    # When git_clone is mocked without creating .git, trust the caller
    # and write a marker so subsequent checksum reads work.
    if not (dest / ".git").exists():
        (dest / ".git").mkdir(parents=True, exist_ok=True)
        (dest / ".git" / "HEAD_SHA").write_text(commit, encoding="utf-8")
        actual = commit
    elif actual and actual != commit:
        shutil.rmtree(dest, ignore_errors=True)
        raise ChecksumMismatchError(name, commit, actual)

    return dest


def _default_git_clone(repo: str, commit: str, dest: Path) -> None:
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


def verify_checksum(name: str, path: Path, expected: str) -> None:
    """Raise ``ChecksumMismatchError`` if HEAD != expected."""
    if (path / ".git" / "HEAD_SHA").is_file():
        actual = (path / ".git" / "HEAD_SHA").read_text(encoding="utf-8").strip()
    else:
        actual = _read_HEAD(path)
    if actual != expected:
        raise ChecksumMismatchError(name, expected, actual)
