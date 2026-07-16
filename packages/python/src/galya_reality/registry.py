"""Registry loading and name resolution."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, TypedDict

import httpx

from galya_reality.exceptions import NetworkError, UnknownValidatorError


class Entrypoints(TypedDict, total=False):
    python: str
    ts: str


class RegistryEntry(TypedDict, total=False):
    repo: str
    commit: str
    entrypoints: Entrypoints
    latency_class: str
    maintainer: str
    parity_fixture: str
    status: str


def _bundled_registry_path() -> Path:
    """Locate the shipped registry JSON.

    Prefer a package-data copy (installed wheel), then fall back to the
    monorepo ``registry/index.json`` for editable / source checkouts.
    """
    data = Path(__file__).resolve().parent / "data" / "index.json"
    if data.is_file():
        return data
    # packages/python/src/galya_reality → repo root (4 levels up)
    repo_root = Path(__file__).resolve().parents[4]
    return repo_root / "registry" / "index.json"


def _load_json_file(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"Registry must be a JSON object, got {type(data)}")
    return data


def _fetch_remote(url: str) -> dict[str, Any]:
    try:
        resp = httpx.get(url, timeout=30.0, follow_redirects=True)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:  # noqa: BLE001 — surface as NetworkError
        raise NetworkError(f"failed to fetch registry from {url}: {exc}") from exc
    if not isinstance(data, dict):
        raise NetworkError(f"remote registry at {url} is not a JSON object")
    return data


def load_registry(
    *,
    registry_url: str | None = None,
    bundled_path: Path | None = None,
) -> dict[str, RegistryEntry]:
    """Load and merge the bundled registry with an optional URL override.

    Entries from ``GALYA_REGISTRY_URL`` (or ``registry_url``) take
    precedence over the bundled index for the same keys.
    """
    path = bundled_path or _bundled_registry_path()
    merged: dict[str, RegistryEntry] = dict(_load_json_file(path))  # type: ignore[arg-type]

    url = registry_url if registry_url is not None else os.environ.get("GALYA_REGISTRY_URL")
    if url:
        override = _fetch_remote(url)
        for key, value in override.items():
            if isinstance(value, dict):
                merged[key] = value  # type: ignore[assignment]
    return merged


def resolve(name: str, registry: dict[str, RegistryEntry] | None = None) -> RegistryEntry:
    """Look up a validator by name. Raises ``UnknownValidatorError`` if missing."""
    reg = registry if registry is not None else load_registry()
    if name not in reg:
        raise UnknownValidatorError(name)
    return reg[name]


def available_languages(entry: RegistryEntry) -> list[str]:
    """Return the language keys present under ``entrypoints``."""
    eps = entry.get("entrypoints") or {}
    return [lang for lang in ("python", "ts") if lang in eps and eps[lang]]
