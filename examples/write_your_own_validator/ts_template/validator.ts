/**
 * Template TypeScript validator — copy into your own repo.
 *
 * Prefer depending on `@galya/reality` and extending `Validator`.
 * Below is a duck-typed equivalent so the template is self-contained.
 */

export class MyValidator {
  name = "my-validator";
  latencyClass = "inline" as const;

  async index(
    _message: { role: string; content: string },
    _context: { messages: unknown[] },
  ): Promise<void> {
    return;
  }

  judge(
    message: { role: string; content: string },
    _context: { messages: unknown[] },
  ) {
    const score = message.content.toLowerCase().includes("ok") ? 1.0 : 0.0;
    return {
      score,
      label: score >= 0.5 ? "pass" : "fail",
      explanations: score >= 0.5 ? ["Contains affirmative signal"] : ["No affirmative signal"],
    };
  }
}
