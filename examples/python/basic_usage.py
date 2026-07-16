"""Basic usage example for galya-reality (Python).

Requires a validator registered in the shared registry and
GALYA_AUTO_INSTALL=1 to skip the interactive prompt.
"""

from __future__ import annotations

import asyncio
import os

import galya_reality as validators
from galya_reality import ContextWindow, Message


async def main() -> None:
    os.environ.setdefault("GALYA_AUTO_INSTALL", "1")

    client = validators.validator("galya-taste")

    message = Message(role="user", content="Hello from the Galya example")
    context = ContextWindow(messages=[message])

    await client.index(message, context)
    result = await client.judge(message, context)
    print(f"score={result.score} label={result.label} rationale={result.rationale}")


if __name__ == "__main__":
    asyncio.run(main())
