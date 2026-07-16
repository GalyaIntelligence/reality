/**
 * Scorer-only smoke example (no LLM).
 *
 * Shows the Galya ↔ Mastra abstraction in isolation: createGalyaScorer → run().
 */

import { createGalyaScorer } from "./galya-scorer.js";

async function main() {
  process.env.GALYA_AUTO_INSTALL ??= "1";

  const scorer = createGalyaScorer({
    validatorName: "galya-taste",
    description: 'Score agent replies with Galya "galya-taste"',
  });

  const result = await scorer.run({
    input: {
      inputMessages: [{ role: "user", content: "Write a short brand-safe reply." }],
    },
    output: [
      {
        role: "assistant",
        content: "Thanks for reaching out — happy to help within our guidelines.",
      },
    ],
  });

  console.log(JSON.stringify({ score: result.score, reason: result.reason }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
