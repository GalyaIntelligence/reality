"""Template Python validator — copy into your own repo."""

from __future__ import annotations

from typing import Any


# In a real validator repo you typically either:
# 1. Depend on `galya-reality` and subclass Validator, or
# 2. Duck-type the same interface (name, latency_class, index, judge).


class Message:
    def __init__(self, role: str, content: str, metadata: dict[str, Any] | None = None):
        self.role = role
        self.content = content
        self.metadata = metadata or {}


class ContextWindow:
    def __init__(self, messages: list[Message], metadata: dict[str, Any] | None = None):
        self.messages = messages
        self.metadata = metadata or {}


class ValidationResult:
    def __init__(
        self,
        score: float,
        label: str | None = None,
        rationale: str | None = None,
        explanations: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        self.score = score
        self.label = label
        self.rationale = rationale
        self.explanations = explanations
        self.metadata = metadata or {}


class MyValidator:
    name = "my-validator"
    latency_class = "inline"

    async def index(self, message: Message, context: ContextWindow) -> None:
        """Optional: update internal state / embeddings from a stream message."""
        return None

    def judge(self, message: Message, context: ContextWindow) -> ValidationResult:
        """Return a score in [0, 1]. Must NOT mutate message/context."""
        score = 1.0 if "ok" in message.content.lower() else 0.0
        return ValidationResult(score=score, label="pass" if score >= 0.5 else "fail")
