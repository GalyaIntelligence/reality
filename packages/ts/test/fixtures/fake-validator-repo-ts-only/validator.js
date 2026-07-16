export class FakeTsOnlyValidator {
  name = "fake-ts-only";
  latencyClass = "inline";

  async index(_message, _context) {
    return;
  }

  judge(_message, _context) {
    return { score: 0.5, label: "ts-only" };
  }
}
