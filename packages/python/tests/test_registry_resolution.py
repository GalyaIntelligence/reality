"""Registry resolution tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from galya_reality.exceptions import NetworkError, UnknownValidatorError
from galya_reality.registry import load_registry, resolve


def test_known_name_resolves(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    index = {
        "galya-taste": {
            "repo": "https://github.com/example/v",
            "commit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "entrypoints": {"python": "validator:V"},
            "latency_class": "async",
            "maintainer": "@x",
            "status": "python-only",
        }
    }
    path = tmp_path / "index.json"
    path.write_text(json.dumps(index), encoding="utf-8")
    monkeypatch.delenv("GALYA_REGISTRY_URL", raising=False)

    reg = load_registry(bundled_path=path)
    entry = resolve("galya-taste", reg)
    assert entry["repo"] == "https://github.com/example/v"
    assert entry["status"] == "python-only"


def test_unknown_name_raises(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    path = tmp_path / "index.json"
    path.write_text("{}", encoding="utf-8")
    monkeypatch.delenv("GALYA_REGISTRY_URL", raising=False)
    reg = load_registry(bundled_path=path)
    with pytest.raises(UnknownValidatorError) as exc:
        resolve("nope", reg)
    assert "nope" in str(exc.value)


def test_registry_url_override(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, httpserver=None):
    """Override via inline mock of httpx — no network."""
    bundled = {
        "local": {
            "repo": "https://github.com/example/local",
            "commit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "entrypoints": {"python": "a:A"},
            "latency_class": "inline",
            "maintainer": "@a",
            "status": "python-only",
        }
    }
    path = tmp_path / "index.json"
    path.write_text(json.dumps(bundled), encoding="utf-8")

    remote = {
        "local": {
            "repo": "https://github.com/example/remote",
            "commit": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "entrypoints": {"python": "b:B"},
            "latency_class": "async",
            "maintainer": "@b",
            "status": "python-only",
        },
        "extra": {
            "repo": "https://github.com/example/extra",
            "commit": "cccccccccccccccccccccccccccccccccccccccc",
            "entrypoints": {"ts": "c:C"},
            "latency_class": "inline",
            "maintainer": "@c",
            "status": "ts-only",
        },
    }
    remote_file = tmp_path / "remote.json"
    remote_file.write_text(json.dumps(remote), encoding="utf-8")

    import galya_reality.registry as regmod

    def fake_fetch(url: str):
        assert url.startswith("file://") or url.endswith("remote.json")
        return json.loads(remote_file.read_text(encoding="utf-8"))

    monkeypatch.setattr(regmod, "_fetch_remote", fake_fetch)
    monkeypatch.delenv("GALYA_REGISTRY_URL", raising=False)

    merged = load_registry(
        bundled_path=path,
        registry_url=f"file://{remote_file}",
    )
    assert merged["local"]["commit"] == "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    assert "extra" in merged
    assert merged["extra"]["status"] == "ts-only"
