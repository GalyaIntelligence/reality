"""Typed errors raised by the Galya validators SDK."""

from __future__ import annotations


class GalyaError(Exception):
    """Base class for all galya-reality errors."""


class UnknownValidatorError(GalyaError):
    """Raised when a validator name is not present in the registry."""

    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Unknown validator: {name!r}")


class LanguageNotSupportedError(GalyaError):
    """Raised when the registry entry has no entrypoint for this SDK's language."""

    def __init__(self, name: str, available: list[str], requested: str = "python") -> None:
        self.name = name
        self.available = available
        self.requested = requested
        langs = ", ".join(available) if available else "(none)"
        super().__init__(
            f"Validator {name!r} does not support language {requested!r}. "
            f"Available language(s): {langs}."
        )


class ChecksumMismatchError(GalyaError):
    """Raised when a cached / cloned commit does not match the pinned SHA."""

    def __init__(self, name: str, expected: str, actual: str) -> None:
        self.name = name
        self.expected = expected
        self.actual = actual
        super().__init__(
            f"Commit mismatch for {name!r}: expected {expected}, got {actual}"
        )


class EntrypointError(GalyaError):
    """Raised when the resolved entrypoint fails to import or satisfy the interface."""

    def __init__(self, name: str, detail: str) -> None:
        self.name = name
        super().__init__(f"Entrypoint error for {name!r}: {detail}")


class NetworkError(GalyaError):
    """Raised on network failures (registry fetch, git clone, etc.)."""

    def __init__(self, detail: str) -> None:
        super().__init__(f"Network error: {detail}")


class InstallCancelledError(GalyaError):
    """Raised when the user declines the interactive install prompt."""

    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Install cancelled for validator {name!r}")
