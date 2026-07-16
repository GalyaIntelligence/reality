/**
 * Mastra scorer backed by a Galya Reality validator.
 *
 * Uses Mastra's `createScorer` pipeline:
 * analyze → Galya `judge()` → generateScore / generateReason
 */

import { createScorer } from "@mastra/core/evals";
import type { ContextWindow, Message, ValidationResult } from "@galya/reality";

export type GalyaJudgeClient = {
  index?(message: Message, context: ContextWindow): Promise<void>;
  judge(message: Message, context: ContextWindow): Promise<ValidationResult>;
};

export type CreateGalyaScorerOptions = {
  /** Catalog validator name, e.g. "galya-taste" */
  validatorName: string;
  /** Scorer id (defaults to `galya-<validatorName>`) */
  id?: string;
  /** Human-readable description */
  description?: string;
  /**
   * Inject a client for tests or custom resolution.
   * When omitted, imports `@galya/reality` and calls `validator(name)`.
   */
  getClient?: () => Promise<GalyaJudgeClient>;
};

function asText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content == null) return "";
  return JSON.stringify(content);
}

/** Pull the latest agent output as a Galya Message. */
export function messageFromAgentOutput(output: unknown): Message {
  if (Array.isArray(output) && output.length > 0) {
    const last = output[output.length - 1] as { role?: string; content?: unknown };
    return {
      role: last.role ?? "assistant",
      content: asText(last.content),
    };
  }
  if (typeof output === "string") {
    return { role: "assistant", content: output };
  }
  if (output && typeof output === "object" && "content" in output) {
    const o = output as { role?: string; content?: unknown };
    return { role: o.role ?? "assistant", content: asText(o.content) };
  }
  return { role: "assistant", content: asText(output) };
}

/** Build a ContextWindow from agent input messages when present. */
export function contextFromAgentInput(input: unknown): ContextWindow {
  const messages: Message[] = [];
  const bag = input as {
    inputMessages?: Array<{ role?: string; content?: unknown }>;
  };
  if (Array.isArray(bag?.inputMessages)) {
    for (const m of bag.inputMessages) {
      messages.push({
        role: m.role ?? "user",
        content: asText(m.content),
      });
    }
  } else if (Array.isArray(input)) {
    for (const m of input as Array<{ role?: string; content?: unknown }>) {
      messages.push({
        role: m.role ?? "user",
        content: asText(m.content),
      });
    }
  }
  return { messages };
}

export function reasonFromResult(result: ValidationResult, score: number): string {
  if (result.explanations?.length) {
    return result.explanations.join("; ");
  }
  if (result.rationale) return result.rationale;
  if (result.label) return `label=${result.label}, score=${score}`;
  return `Galya score: ${score}`;
}

/**
 * Create a Mastra scorer that delegates scoring to a Galya Reality validator.
 */
export function createGalyaScorer(options: CreateGalyaScorerOptions) {
  const id = options.id ?? `galya-${options.validatorName}`;

  return createScorer({
    id,
    name: id,
    description:
      options.description ??
      `Galya Reality validator "${options.validatorName}"`,
    type: "agent",
  })
    .analyze(async ({ run }) => {
      const getClient =
        options.getClient ??
        (async () => {
          const { validator } = await import("@galya/reality");
          return validator(options.validatorName, {
            confirm: false,
          } as Parameters<typeof validator>[1]);
        });

      const client = await getClient();
      const message = messageFromAgentOutput(run.output);
      const context = contextFromAgentInput(run.input);
      if (context.messages.length === 0) {
        context.messages.push(message);
      }
      if (typeof client.index === "function") {
        await client.index(message, context);
      }
      return client.judge(message, context);
    })
    .generateScore(({ results }) => {
      const result = results.analyzeStepResult as ValidationResult;
      return result.score;
    })
    .generateReason(({ results, score }) => {
      const result = results.analyzeStepResult as ValidationResult;
      return reasonFromResult(result, score);
    });
}
