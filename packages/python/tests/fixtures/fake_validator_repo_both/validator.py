# Both-languages fake validator (Python side)
from galya_reality.base import ContextWindow, Message, ValidationResult, Validator


class FakeBothValidator(Validator):
    name = "fake-both"
    latency_class = "inline"

    async def index(self, message: Message, context: ContextWindow) -> None:
        return None

    def judge(self, message: Message, context: ContextWindow) -> ValidationResult:
        # Deterministic score from content length for parity testing
        score = min(1.0, len(message.content) / 100.0)
        return ValidationResult(score=score, label="ok", rationale="length-based")
