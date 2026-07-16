"""Singleton cache identity checks."""

from __future__ import annotations

from galya_reality.client import _CLIENTS, _reset_clients, validator
from conftest import BOTH, clone_from_fixture


def test_singleton_keyed_by_name(registry, cache_dir, monkeypatch):
    from galya_reality import client as client_mod

    monkeypatch.setattr(client_mod, "smoke_test", lambda *a, **k: None)
    monkeypatch.setattr(client_mod, "load_registry", lambda: registry)

    def patched_ensure(name, entry, **kwargs):
        from galya_reality.installer import ensure_installed as real

        kwargs["git_clone"] = clone_from_fixture(BOTH)
        kwargs["confirm"] = False
        kwargs["cache_dir"] = cache_dir
        return real(name, entry, **kwargs)

    monkeypatch.setattr(client_mod, "ensure_installed", patched_ensure)
    _reset_clients()

    first = validator("fake-both")
    second = validator("fake-both")
    assert first is second
    assert "fake-both" in _CLIENTS
