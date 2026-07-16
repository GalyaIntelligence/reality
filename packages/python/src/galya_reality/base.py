"""Core Validator interface and data models."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ContextWindow(BaseModel):
    messages: list[Message]
    metadata: dict[str, Any] = Field(default_factory=dict)


class ValidationResult(BaseModel):
    score: float
    label: str | None = None
    rationale: str | None = None
    explanations: list[str] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class Validator:
    """Base interface every Python validator must satisfy."""

    name: str
    latency_class: Literal["inline", "async"]

    async def index(self, message: Message, context: ContextWindow) -> None:
        raise NotImplementedError

    def judge(self, message: Message, context: ContextWindow) -> ValidationResult:
        raise NotImplementedError
