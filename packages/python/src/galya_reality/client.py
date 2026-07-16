"""Client: resolve a single validator by name and wrap index/judge."""

from __future__ import annotations

import importlib
import inspect
import sys
from pathlib import Path
from typing import Any

from galya_reality.base import ContextWindow, Message, ValidationResult, Validator
from galya_reality.exceptions import EntrypointError, LanguageNotSupportedError
from galya_reality.installer import ensure_installed
from galya_reality.registry import (
    RegistryEntry,
    available_languages,
    load_registry,
    resolve,
)
from galya_reality.sandbox import smoke_test

# In-process singleton cache keyed by validator name.
_CLIENTS: dict[str, "ValidatorClient"] = {}


class ValidatorClient:
    """Thin wrapper around one installed Validator instance."""

    def __init__(self, name: str, impl: Validator, entry: RegistryEntry) -> None:
        self.name = name
        self._impl = impl
        self._entry = entry
        self.latency_class = getattr(impl, "latency_class", entry.get("latency_class", "inline"))

    async def index(self, message: Message, context: ContextWindow) -> None:
        result = self._impl.index(message, context)
        if inspect.isawaitable(result):
            await result

    async def judge(self, message: Message, context: ContextWindow) -> ValidationResult:
        result = self._impl.judge(message, context)
        if inspect.isawaitable(result):
            result = await result
        if isinstance(result, ValidationResult):
            return result
        if isinstance(result, dict):
            return ValidationResult.model_validate(result)
        raise EntrypointError(self.name, f"judge() returned unexpected type: {type(result)}")


def _load_impl(path: Path, entrypoint: str, name: str) -> Validator:
    module_name, _, class_name = entrypoint.partition(":")
    if not module_name or not class_name:
        raise EntrypointError(name, f"invalid entrypoint {entrypoint!r}; expected 'module:Class'")

    # Ensure the cloned repo is importable
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

    try:
        mod = importlib.import_module(module_name)
        # Reload in case a previous test imported a different fixture under the same name
        mod = importlib.reload(mod)
        cls = getattr(mod, class_name)
        inst = cls()
    except Exception as exc:  # noqa: BLE001
        raise EntrypointError(name, str(exc)) from exc

    for attr in ("name", "latency_class", "index", "judge"):
        if not hasattr(inst, attr):
            raise EntrypointError(name, f"implementation missing required attribute: {attr}")
    if getattr(inst, "latency_class", None) not in ("inline", "async"):
        raise EntrypointError(
            name, f"invalid latency_class: {getattr(inst, 'latency_class', None)!r}"
        )
    return inst  # type: ignore[return-value]


def validator(
    name: str,
    *,
    registry: dict[str, RegistryEntry] | None = None,
    cache_dir: Path | None = None,
    git_clone: Any = None,
    confirm: bool = True,
    skip_smoke: bool = False,
) -> ValidatorClient:
    """Resolve ``name`` against the registry and return a singleton client.

    One validator per client — no multi-name fan-out.
    """
    if name in _CLIENTS and registry is None and git_clone is None and cache_dir is None:
        return _CLIENTS[name]

    entry = resolve(name, registry if registry is not None else load_registry())
    langs = available_languages(entry)
    if "python" not in langs:
        raise LanguageNotSupportedError(name, langs, requested="python")

    entrypoint = entry["entrypoints"]["python"]
    path = ensure_installed(
        name,
        entry,
        cache_dir=cache_dir,
        git_clone=git_clone,
        confirm=confirm,
    )

    if not skip_smoke:
        smoke_test(path, entrypoint, name)

    impl = _load_impl(path, entrypoint, name)
    client = ValidatorClient(name, impl, entry)

    # Only memoize the "default path" resolutions
    if registry is None and git_clone is None and cache_dir is None:
        _CLIENTS[name] = client
    return client


def _reset_clients() -> None:
    """Test helper: clear the in-process singleton cache."""
    _CLIENTS.clear()
