"""Tests for Galya Reality ↔ LangGraph helpers and plug-in graph."""

from __future__ import annotations

from typing import Any, TypedDict

import pytest
from langgraph.graph import END, START, StateGraph

from galya_reality.base import ValidationResult
from galya_reality_langgraph import (
    context_from_state,
    make_galya_index_node,
    make_galya_judge_node,
    message_from_state,
    route_after_gate,
    route_on_galya_score,
    state_update_from_result,
)
from example_graph import build_agent_with_galya


class GState(TypedDict, total=False):
    messages: list[Any]
    galya_score: float
    path: str


def test_message_and_context_from_state():
    state = {
        "messages": [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "hello"},
        ]
    }
    assert message_from_state(state).content == "hello"
    ctx = context_from_state(state)
    assert len(ctx.messages) == 2
    assert ctx.messages[0].content == "hi"


def test_state_update_from_result():
    result = ValidationResult(
        score=0.85,
        label="pass",
        rationale="ok",
        explanations=["clear", "safe"],
    )
    update = state_update_from_result(result)
    assert update["galya_score"] == 0.85
    assert update["galya_explanations"] == ["clear", "safe"]
    assert update["galya_reason"] == "clear; safe"


def test_route_on_galya_score():
    assert route_on_galya_score({"galya_score": 0.9}, threshold=0.7) == "accept"
    assert route_on_galya_score({"galya_score": 0.2}, threshold=0.7) == "revise"


def test_route_after_gate():
    assert route_after_gate({"galya_score": 0.9, "attempt": 1}) == "accept"
    assert route_after_gate({"galya_score": 0.2, "attempt": 1}, max_attempts=3) == "revise"
    assert route_after_gate({"galya_score": 0.2, "attempt": 3}, max_attempts=3) == "reject"


@pytest.mark.asyncio
async def test_judge_node_with_injected_fn():
    async def fake_judge(message, context):
        assert message.content == "reply"
        return ValidationResult(
            score=0.92,
            label="pass",
            explanations=["Tone OK"],
        )

    node = make_galya_judge_node(judge=fake_judge, pass_threshold=0.7)
    out = await node(
        {
            "messages": [
                {"role": "user", "content": "q"},
                {"role": "assistant", "content": "reply"},
            ]
        }
    )
    assert out["galya_score"] == 0.92
    assert out["galya_passed"] is True
    assert out["galya_explanations"] == ["Tone OK"]


@pytest.mark.asyncio
async def test_index_then_judge_order():
    calls: list[str] = []

    async def fake_index(message, context):
        calls.append("index")

    async def fake_judge(message, context):
        calls.append("judge")
        return ValidationResult(score=0.8)

    idx = make_galya_index_node(index=fake_index)
    jdg = make_galya_judge_node(judge=fake_judge)
    state = {"messages": [{"role": "assistant", "content": "x"}]}
    await idx(state)
    await jdg(state)
    assert calls == ["index", "judge"]


async def _async_noop(*_a, **_k):
    return None


@pytest.mark.asyncio
async def test_agent_graph_plugs_in_galya_nodes():
    """Your draft node + Galya index/judge — no encapsulated revise loop."""

    async def fake_judge(message, context):
        assert message.content == "Thank you for your note."
        return ValidationResult(
            score=0.91,
            explanations=["On brand"],
        )

    def gen(history):
        assert history
        return "Thank you for your note."

    app = build_agent_with_galya(
        validator_name="fake",
        pass_threshold=0.7,
        generate_reply=gen,
        index=_async_noop,
        judge=fake_judge,
    )

    result = await app.ainvoke(
        {"messages": [{"role": "user", "content": "Thank the customer."}]}
    )
    assert result["galya_score"] == 0.91
    assert result["galya_passed"] is True
    assert result["galya_reason"] == "On brand"
    last = result["messages"][-1]
    content = last["content"] if isinstance(last, dict) else getattr(last, "content", "")
    assert content == "Thank you for your note."


@pytest.mark.asyncio
async def test_graph_conditional_routing_with_mock_judge():
    async def fake_judge(message, context):
        return ValidationResult(score=0.3, label="fail", rationale="weak")

    async def draft(state):
        return {"messages": [{"role": "assistant", "content": "draft"}]}

    async def accept(state):
        return {"path": "accept"}

    async def revise(state):
        return {"path": "revise"}

    graph = StateGraph(GState)
    graph.add_node("draft", draft)
    graph.add_node("galya_judge", make_galya_judge_node(judge=fake_judge))
    graph.add_node("accept", accept)
    graph.add_node("revise", revise)
    graph.add_edge(START, "draft")
    graph.add_edge("draft", "galya_judge")
    graph.add_conditional_edges(
        "galya_judge",
        lambda s: route_on_galya_score(s, threshold=0.7),
        {"accept": "accept", "revise": "revise"},
    )
    graph.add_edge("accept", END)
    graph.add_edge("revise", END)
    app = graph.compile()

    result = await app.ainvoke({"messages": [{"role": "user", "content": "hi"}]})
    assert result["galya_score"] == 0.3
    assert result["path"] == "revise"
