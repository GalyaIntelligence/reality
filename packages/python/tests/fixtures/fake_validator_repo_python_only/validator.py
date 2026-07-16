from galya_reality.base import ContextWindow, Message, ValidationResult, Validator


class FakePythonOnlyValidator(Validator):
    name = "fake-python-only"
    latency_class = "inline"

    async def index(self, message: Message, context: ContextWindow) -> None:
        return None

    def judge(self, message: Message, context: ContextWindow) -> ValidationResult:
        return ValidationResult(score=0.5, label="python-only")
