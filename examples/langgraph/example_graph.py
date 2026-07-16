"""
Example: your LangGraph agent + Galya Reality nodes plugged in.

The draft / LLM step is a normal graph node you own. Galya only provides
``make_galya_index_node`` / ``make_galya_judge_node`` to score the latest message.

Env:
  OPENAI_API_KEY         — required for live LLM (or inject generate_reply=)
  OPENAI_MODEL           — default gpt-4o-mini
  GALYA_VALIDATOR_NAME   — default galya-taste
  GALYA_PASS_THRESHOLD   — default 0.7 (optional; writes galya_passed)
  GALYA_AUTO_INSTALL=1
"""

from __future__ import annotations

import asyncio
import os
from typing import Annotated, Any, Callable, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from galya_reality_langgraph import (
    make_galya_index_node,
    make_galya_judge_node,
)


class State(TypedDict, total=False):
    messages: Annotated[list[Any], add_messages]
    galya_score: float
    galya_label: str | None
    galya_rationale: str | None
    galya_explanations: list[str] | None
    galya_reason: str | None
    galya_passed: bool


GenerateFn = Callable[[list[dict[str, str]]], Any]


def _default_llm_generate(messages: list[dict[str, str]]) -> str:
    """Your LLM call — swap for any provider / agent framework."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is required for the live example "
            "(or pass generate_reply= for offline use)."
        )
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

    model = ChatOpenAI(
        model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.4,
    )
    lc_messages: list[Any] = [
        SystemMessage(
            content=(
                "You are a careful assistant. Write concise, brand-safe replies. "
                "Return only the assistant reply text."
            )
        )
    ]
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "assistant":
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))
    result = model.invoke(lc_messages)
    return str(result.content).strip()


def build_agent_with_galya(
    *,
    validator_name: str,
    pass_threshold: float | None = 0.7,
    generate_reply: GenerateFn | None = None,
    index=None,
    judge=None,
):
    """
    Compile a minimal graph that demonstrates the plug-in pattern:

        START → draft (yours) → galya_index → galya_judge → END

    Replace ``draft`` with your real agent node; keep the Galya nodes as-is.
    """

    gen = generate_reply or (lambda msgs: _default_llm_generate(msgs))

    async def draft(state: State) -> dict[str, Any]:
        # --- fully yours: any agent / LLM / tool loop ---
        history: list[dict[str, str]] = []
        for m in state.get("messages") or []:
            if isinstance(m, dict):
                history.append(
                    {
                        "role": str(m.get("role") or "user"),
                        "content": str(m.get("content") or ""),
                    }
                )
            else:
                role = getattr(m, "type", None) or getattr(m, "role", None) or "user"
                if role in ("human", "user"):
                    role = "user"
                elif role in ("ai", "assistant"):
                    role = "assistant"
                history.append(
                    {"role": str(role), "content": str(getattr(m, "content", ""))}
                )

        text = gen(history)
        if hasattr(text, "__await__"):
            text = await text
        return {"messages": [{"role": "assistant", "content": str(text)}]}

    # --- Galya plug-ins only ---
    index_node = make_galya_index_node(validator_name=validator_name, index=index)
    judge_node = make_galya_judge_node(
        validator_name=validator_name,
        judge=judge,
        pass_threshold=pass_threshold,
    )

    graph = StateGraph(State)
    graph.add_node("draft", draft)
    graph.add_node("galya_index", index_node)
    graph.add_node("galya_judge", judge_node)

    graph.add_edge(START, "draft")
    graph.add_edge("draft", "galya_index")
    graph.add_edge("galya_index", "galya_judge")
    graph.add_edge("galya_judge", END)
    return graph.compile()


# Back-compat alias
def build_graph(validator_name: str):
    return build_agent_with_galya(validator_name=validator_name)


async def main() -> None:
    name = os.environ.get("GALYA_VALIDATOR_NAME", "galya-taste")
    threshold = float(os.environ.get("GALYA_PASS_THRESHOLD", "0.7"))
    os.environ.setdefault("GALYA_AUTO_INSTALL", "1")

    prompt = os.environ.get(
        "GALYA_PROMPT",
        "Write a short brand-safe customer reply thanking them for their feedback.",
    )

    app = build_agent_with_galya(
        validator_name=name,
        pass_threshold=threshold,
    )
    result = await app.ainvoke({"messages": [{"role": "user", "content": prompt}]})
    print(
        {
            "galya_score": result.get("galya_score"),
            "galya_passed": result.get("galya_passed"),
            "galya_reason": result.get("galya_reason"),
            "galya_explanations": result.get("galya_explanations"),
            "last_message": (result.get("messages") or [])[-1],
        }
    )


if __name__ == "__main__":
    asyncio.run(main())
