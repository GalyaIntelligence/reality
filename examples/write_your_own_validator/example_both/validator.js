/** Example both-languages validator (JS) — for local parity CI only. */

export class ExampleBothValidator {
  name = "example-both";
  latencyClass = "inline";

  async index(_message, _context) {
    return;
  }

  judge(message, _context) {
    const score = Math.min(1.0, message.content.length / 100.0);
    const label = score >= 0.3 ? "ok" : "low";
    return { score, label, rationale: "length-based" };
  }
}
