/** Both-languages fake validator (TypeScript ecosystem fixture as plain JS). */

export class FakeBothValidator {
  name = "fake-both";
  latencyClass = "inline";

  async index(_message, _context) {
    return;
  }

  judge(message, _context) {
    const score = Math.min(1.0, message.content.length / 100.0);
    return { score, label: "ok", rationale: "length-based" };
  }
}

export class SyncJudgeValidator {
  name = "sync-judge";
  latencyClass = "inline";
  static indexed = [];

  async index(message, _context) {
    SyncJudgeValidator.indexed.push(message.content);
  }

  judge(_message, _context) {
    return { score: 0.42, label: "sync" };
  }
}

export class AsyncJudgeValidator {
  name = "async-judge";
  latencyClass = "async";

  async index(_message, _context) {
    return;
  }

  async judge(_message, _context) {
    return { score: 0.88, label: "async" };
  }
}
