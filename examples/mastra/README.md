# Mastra + Galya Reality

Plug Galya into **your** Mastra agent via a scorer. The agent (model, tools,
instructions, memory) stays fully yours — Galya only provides `index` / `judge`
scoring through Mastra's evals API.

## Setup

```bash
cd examples/mastra
npm install
npm test
```

## Plug into an existing agent

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { createGalyaScorer } from "./src/galya-scorer.js";

const galyaScorer = createGalyaScorer({
  validatorName: "galya-taste", // or GALYA_VALIDATOR_NAME
});

// Your agent — customize freely
const agent = new Agent({
  id: "support-agent",
  name: "support-agent",
  instructions: "You are a helpful support agent…",
  model: openai("gpt-4o-mini"),
  scorers: {
    galya: {
      scorer: galyaScorer,
      sampling: { type: "ratio", rate: 1 },
    },
  },
});

const result = await agent.generate([
  { role: "user", content: "Write a short brand-safe thank-you." },
]);
```

`createGalyaScorer` maps Mastra run input/output → Galya `index` + `judge` →
score + reason. Nothing else about the agent is wrapped.

## Live example

```bash
export OPENAI_API_KEY=sk-...
export GALYA_VALIDATOR_NAME=galya-taste   # optional
npm run example
```

Scorer-only (no LLM):

```bash
npm run example:scorer
```

## Tests

```bash
npm test
```

Vitest mocks the Galya client — no API key or live registry required.
