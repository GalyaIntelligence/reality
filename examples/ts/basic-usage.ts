/**
 * Basic usage example for @galya/reality.
 *
 * Requires a validator registered in the shared registry and
 * GALYA_AUTO_INSTALL=1 to skip the interactive prompt.
 */

import { validator, type ContextWindow, type Message } from "@galya/reality";

async function main() {
  process.env.GALYA_AUTO_INSTALL ??= "1";

  const name = process.env.GALYA_VALIDATOR_NAME ?? "galya-taste";
  const client = await validator(name);

  const message: Message = {
    role: "user",
    content: "Hello from the Galya example",
  };
  const context: ContextWindow = { messages: [message] };

  await client.index(message, context);
  const result = await client.judge(message, context);
  console.log(
    `score=${result.score} label=${result.label} rationale=${result.rationale}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
