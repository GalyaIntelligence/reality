import { describe, it, expect, vi } from "vitest";
import {
  createGalyaScorer,
  messageFromAgentOutput,
  contextFromAgentInput,
  reasonFromResult,
} from "../src/galya-scorer.js";
import type { ValidationResult } from "@galya/reality";

describe("message / context helpers", () => {
  it("extracts assistant message from agent output array", () => {
    const msg = messageFromAgentOutput([
      { role: "assistant", content: "hello world" },
    ]);
    expect(msg).toEqual({ role: "assistant", content: "hello world" });
  });

  it("builds context from inputMessages", () => {
    const ctx = contextFromAgentInput({
      inputMessages: [{ role: "user", content: "hi" }],
    });
    expect(ctx.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("prefers explanations for reason text", () => {
    const result: ValidationResult = {
      score: 0.8,
      explanations: ["clear", "on-brand"],
      rationale: "ignored when explanations present",
    };
    expect(reasonFromResult(result, 0.8)).toBe("clear; on-brand");
  });
});

describe("createGalyaScorer (Mastra)", () => {
  it("scores via injected Galya client and surfaces explanations as reason", async () => {
    const judge = vi.fn(async () => ({
      score: 0.91,
      label: "pass",
      rationale: "looks good",
      explanations: ["Tone OK", "No policy hits"],
      metadata: {},
    }));

    const scorer = createGalyaScorer({
      validatorName: "fake-taste",
      getClient: async () => ({ judge }),
    });

    const out = await scorer.run({
      input: {
        inputMessages: [{ role: "user", content: "Say hello politely." }],
      },
      output: [{ role: "assistant", content: "Hello — glad to help." }],
    });

    expect(judge).toHaveBeenCalledTimes(1);
    expect(out.score).toBeCloseTo(0.91);
    expect(out.reason).toBe("Tone OK; No policy hits");
  });

  it("falls back to rationale when explanations are absent", async () => {
    const scorer = createGalyaScorer({
      validatorName: "fake-taste",
      getClient: async () => ({
        judge: async () => ({
          score: 0.4,
          label: "fail",
          rationale: "off-brand wording",
        }),
      }),
    });

    const out = await scorer.run({
      input: { inputMessages: [{ role: "user", content: "x" }] },
      output: [{ role: "assistant", content: "y" }],
    });

    expect(out.score).toBeCloseTo(0.4);
    expect(out.reason).toBe("off-brand wording");
  });
});
