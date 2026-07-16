"""LangGraph helpers that call Galya Reality from graph nodes."""

from __future__ import annotations

from typing import Any, Awaitable, Callable, TypedDict

from galya_reality.base import ContextWindow, Message, ValidationResult

JudgeFn = Callable[[Message, ContextWindow], Awaitable[ValidationResult]]
IndexFn = Callable[[Message, ContextWindow], Awaitable[None]]


class GalyaJudgeState(TypedDict, total=False):
    """Minimal state slice for a Galya judge node."""

    messages: list[dict[str, Any]]
    galya_score: float
    galya_label: str | None
    galya_rationale: str | None
    galya_explanations: list[str] | None
    galya_reason: str | None
    galya_passed: bool
    attempt: int


def message_from_state(state: dict[str, Any]) -> Message:
    """Use the last message in state as the candidate to judge."""
    messages = state.get("messages") or []
    if not messages:
        return Message(role="assistant", content="")
    last = messages[-1]
    if isinstance(last, dict):
        return Message(
            role=str(last.get("role") or "assistant"),
            content=str(last.get("content") or ""),
        )
    role = getattr(last, "type", None) or getattr(last, "role", None) or "assistant"
    content = getattr(last, "content", "")
    return Message(role=str(role), content=str(content))


def context_from_state(state: dict[str, Any]) -> ContextWindow:
    """Build a context window from all messages (full window for index/judge)."""
    raw = state.get("messages") or []
    out: list[Message] = []
    for m in raw:
        if isinstance(m, dict):
            out.append(
                Message(
                    role=str(m.get("role") or "user"),
                    content=str(m.get("content") or ""),
                )
            )
        else:
            role = getattr(m, "type", None) or getattr(m, "role", None) or "user"
            content = getattr(m, "content", "")
            out.append(Message(role=str(role), content=str(content)))
    if not out:
        out = [message_from_state(state)]
    return ContextWindow(messages=out)


def reason_from_result(result: ValidationResult) -> str:
    if result.explanations:
        return "; ".join(result.explanations)
    if result.rationale:
        return result.rationale
    if result.label:
        return f"label={result.label}, score={result.score}"
    return f"Galya score: {result.score}"


def state_update_from_result(result: ValidationResult) -> dict[str, Any]:
    return {
        "galya_score": result.score,
        "galya_label": result.label,
        "galya_rationale": result.rationale,
        "galya_explanations": result.explanations,
        "galya_reason": reason_from_result(result),
    }


def _resolve_client(validator_name: str | None):
    if not validator_name:
        raise ValueError("Provide validator_name or an injected callable")
    from galya_reality import validator

    return validator(validator_name, confirm=False)


def make_galya_index_node(
    *,
    validator_name: str | None = None,
    index: IndexFn | None = None,
) -> Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]:
    """Build an async node that runs Galya ``index()`` on the latest message."""

    async def galya_index_node(state: dict[str, Any]) -> dict[str, Any]:
        fn = index
        if fn is None:
            client = _resolve_client(validator_name)
            fn = client.index
        message = message_from_state(state)
        context = context_from_state(state)
        await fn(message, context)
        return {}

    return galya_index_node


def make_galya_judge_node(
    *,
    validator_name: str | None = None,
    judge: JudgeFn | None = None,
    score_key: str = "galya_score",
    pass_threshold: float | None = None,
) -> Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]:
    """
    Build an async LangGraph node that runs Galya ``judge()``.

    Provide either ``judge`` (for tests) or ``validator_name`` (live SDK).
    When ``pass_threshold`` is set, also writes ``galya_passed: bool``.
    """

    async def galya_judge_node(state: dict[str, Any]) -> dict[str, Any]:
        fn = judge
        if fn is None:
            client = _resolve_client(validator_name)
            fn = client.judge

        message = message_from_state(state)
        context = context_from_state(state)
        result = await fn(message, context)
        update = state_update_from_result(result)
        if score_key != "galya_score":
            update[score_key] = update.pop("galya_score")
        if pass_threshold is not None:
            update["galya_passed"] = result.score >= pass_threshold
        return update

    return galya_judge_node


def route_on_galya_score(
    state: dict[str, Any],
    *,
    threshold: float = 0.7,
    pass_node: str = "accept",
    fail_node: str = "revise",
) -> str:
    """Conditional edge helper: route by Galya score."""
    score = float(state.get("galya_score") or 0.0)
    return pass_node if score >= threshold else fail_node


def route_after_gate(
    state: dict[str, Any],
    *,
    threshold: float = 0.7,
    max_attempts: int = 3,
    pass_node: str = "accept",
    revise_node: str = "revise",
    fail_node: str = "reject",
) -> str:
    """Pass, revise (if attempts remain), or reject."""
    score = float(state.get("galya_score") or 0.0)
    if score >= threshold:
        return pass_node
    attempt = int(state.get("attempt") or 1)
    if attempt >= max_attempts:
        return fail_node
    return revise_node
