"""Async and sync judge helpers for client tests."""

from galya_reality.base import ContextWindow, Message, ValidationResult, Validator


class SyncJudgeValidator(Validator):
    name = "sync-judge"
    latency_class = "inline"
    indexed: list[str] = []

    async def index(self, message: Message, context: ContextWindow) -> None:
        SyncJudgeValidator.indexed.append(message.content)

    def judge(self, message: Message, context: ContextWindow) -> ValidationResult:
        return ValidationResult(score=0.42, label="sync")


class AsyncJudgeValidator(Validator):
    name = "async-judge"
    latency_class = "async"

    async def index(self, message: Message, context: ContextWindow) -> None:
        return None

    async def judge(self, message: Message, context: ContextWindow) -> ValidationResult:
        return ValidationResult(score=0.88, label="async")
