/**
 * Plug Galya Reality into a normal Mastra Agent via scorers.
 *
 * Your agent (instructions, model, tools, memory) stays yours —
 * `createGalyaScorer` only adds index/judge scoring on generations.
 */

import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { createGalyaScorer } from "./galya-scorer.js";

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required (or run `npm run example:scorer` / `npm test` offline).",
    );
  }

  process.env.GALYA_AUTO_INSTALL ??= "1";

  // 1. Galya plug-in — only the scorer talks to the Reality SDK
  const galyaScorer = createGalyaScorer({
    validatorName: "galya-taste",
    description: 'Score replies with Galya "galya-taste"',
  });

  // 2. Your agent — fully customizable (model, tools, memory, instructions)
  const agent = new Agent({
    id: "support-agent",
    name: "support-agent",
    instructions:
      process.env.GALYA_AGENT_INSTRUCTIONS ??
      "You are a helpful support agent. Write concise, brand-safe replies.",
    model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
    scorers: {
      galya: {
        scorer: galyaScorer,
        sampling: { type: "ratio", rate: 1 },
      },
    },
  });

  const prompt =
    process.env.GALYA_PROMPT ??
    "Write a short brand-safe customer reply thanking them for their feedback.";

  const result = await agent.generate([{ role: "user", content: prompt }]);

  console.log(
    JSON.stringify(
      {
        text: "text" in result ? result.text : result,
        // Scorer results appear when Mastra evals run with the attached scorer
        scorers: "scorers" in result ? result.scorers : undefined,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
