"""Example both-languages validator (Python) — for local parity CI only.

This is a TEMPLATE/fixture, not a published third-party validator.
"""

from __future__ import annotations


class ExampleBothValidator:
    name = "example-both"
    latency_class = "inline"

    async def index(self, message, context) -> None:
        return None

    def judge(self, message, context):
        score = min(1.0, len(message.content) / 100.0)
        # Match the TS implementation exactly
        label = "ok" if score >= 0.3 else "low"
        return {
            "score": score,
            "label": label,
            "rationale": "length-based",
        }
