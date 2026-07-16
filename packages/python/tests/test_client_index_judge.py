"""Client index/judge + singleton reuse."""

from __future__ import annotations

import pytest

from conftest import BOTH, clone_from_fixture
from galya_reality.base import ContextWindow, Message
from galya_reality.client import _reset_clients, validator


@pytest.mark.asyncio
async def test_index_and_sync_judge(registry, cache_dir):
    client = validator(
        "sync-judge",
        registry=registry,
        cache_dir=cache_dir,
        git_clone=clone_from_fixture(BOTH),
        confirm=False,
        skip_smoke=True,
    )
    msg = Message(role="user", content="hello")
    ctx = ContextWindow(messages=[msg])
    await client.index(msg, ctx)
    result = await client.judge(msg, ctx)
    assert result.score == pytest.approx(0.42)
    assert result.label == "sync"


@pytest.mark.asyncio
async def test_async_judge(registry, cache_dir):
    client = validator(
        "async-judge",
        registry=registry,
        cache_dir=cache_dir,
        git_clone=clone_from_fixture(BOTH),
        confirm=False,
        skip_smoke=True,
    )
    msg = Message(role="user", content="hi")
    ctx = ContextWindow(messages=[msg])
    result = await client.judge(msg, ctx)
    assert result.score == pytest.approx(0.88)
    assert result.label == "async"


@pytest.mark.asyncio
async def test_both_languages_fixture_resolves(registry, cache_dir):
    client = validator(
        "fake-both",
        registry=registry,
        cache_dir=cache_dir,
        git_clone=clone_from_fixture(BOTH),
        confirm=False,
        skip_smoke=True,
    )
    msg = Message(role="user", content="x" * 50)
    ctx = ContextWindow(messages=[msg])
    result = await client.judge(msg, ctx)
    assert result.score == pytest.approx(0.5)
    assert result.label == "ok"


def test_singleton_reuse(registry, cache_dir, monkeypatch):
    # Force default-path memoization: no custom cache_dir/registry/git_clone
    # We still inject via monkeypatching ensure_installed internals instead.
    from galya_reality import client as client_mod
    from galya_reality.installer import ensure_installed as real_ensure

    def patched_ensure(name, entry, **kwargs):
        kwargs["git_clone"] = clone_from_fixture(BOTH)
        kwargs["confirm"] = False
        kwargs["cache_dir"] = cache_dir
        return real_ensure(name, entry, **kwargs)

    monkeypatch.setattr(client_mod, "ensure_installed", patched_ensure)
    monkeypatch.setattr(client_mod, "load_registry", lambda: registry)
    monkeypatch.setattr(client_mod, "smoke_test", lambda *a, **k: None)

    _reset_clients()
    a = validator("fake-both")
    b = validator("fake-both")
    assert a is b
