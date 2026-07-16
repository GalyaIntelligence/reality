/** Core Validator interface and data types. */

export type LatencyClass = "inline" | "async";

export interface Message {
  role: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ContextWindow {
  messages: Message[];
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  score: number;
  label?: string;
  rationale?: string;
  /** Optional human-readable explanations supporting the score. */
  explanations?: string[];
  metadata?: Record<string, unknown>;
}

export abstract class Validator {
  abstract name: string;
  abstract latencyClass: LatencyClass;
  abstract index(message: Message, context: ContextWindow): Promise<void>;
  abstract judge(
    message: Message,
    context: ContextWindow,
  ): ValidationResult | Promise<ValidationResult>;
}
