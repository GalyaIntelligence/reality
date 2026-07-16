# LangGraph + Galya Reality

Plug Galya into **your** LangGraph agent as nodes. The draft / LLM step stays
yours — Galya only provides `make_galya_index_node` / `make_galya_judge_node`.

## Setup

```bash
cd examples/langgraph
uv sync --extra dev
uv run pytest -q
```

## Plug into an existing graph

```python
from langgraph.graph import END, START, StateGraph
from galya_reality_langgraph import make_galya_index_node, make_galya_judge_node

async def draft(state):
    # your agent / LLM / tools — fully customizable
    ...
    return {"messages": [{"role": "assistant", "content": reply}]}

graph = StateGraph(State)
graph.add_node("draft", draft)
graph.add_node("galya_index", make_galya_index_node(validator_name="galya-taste"))
graph.add_node(
    "galya_judge",
    make_galya_judge_node(validator_name="galya-taste", pass_threshold=0.7),
)
graph.add_edge(START, "draft")
graph.add_edge("draft", "galya_index")
graph.add_edge("galya_index", "galya_judge")
graph.add_edge("galya_judge", END)
```

Optional helpers: `route_on_galya_score` / `route_after_gate` if you want to
branch on `galya_score` yourself.

## Live example

```bash
export OPENAI_API_KEY=sk-...
GALYA_AUTO_INSTALL=1 uv run python example_graph.py
```

## Tests

```bash
uv run pytest -q
```

Mocks cover index→judge order and a plug-in graph — no API key or live registry required.
