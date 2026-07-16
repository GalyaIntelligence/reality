# Contributing to galya-reality

This repository hosts the **shared registry** and the **Python / TypeScript
SDKs** that resolve validator names against it. It does **not** host
validator implementations. Validators live in their own GitHub repos.

## 1. Build a validator (in your own repo)

Use the templates under
[`examples/write_your_own_validator/`](./examples/write_your_own_validator/).

You may ship:

- **Python only** — copy `python_template/`
- **TypeScript only** — copy `ts_template/`
- **Both** — copy both templates; they must be logically equivalent
  (same `judge()` scoring for the same input) and you **must** include a
  `parity_fixture.json` that CI will use to verify agreement

Single-language validators are **first-class**, not second-class. A
Python-only validator is fully supported for Python callers; TypeScript
callers get a clear `LanguageNotSupportedError` (and vice versa).

Ship a `validator.yaml` manifest declaring whichever entrypoint(s) you
built, tag a release, and note the exact full commit SHA.

## 2. Register it here

Open a PR against this repo that adds **exactly one entry** to
[`registry/index.json`](./registry/index.json). Do not modify
`packages/python` or `packages/ts` source.

Example entry (both languages):

```json
{
  "my-validator": {
    "repo": "https://github.com/you/validator-my-name",
    "commit": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "entrypoints": {
      "python": "validator:MyValidator",
      "ts": "validator.ts:MyValidator"
    },
    "latency_class": "inline",
    "maintainer": "@you",
    "status": "both",
    "parity_fixture": "fixtures/parity_case_01.json"
  }
}
```

Example entry (Python only):

```json
{
  "fraud-signal": {
    "repo": "https://github.com/you/validator-fraud-signal",
    "commit": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "entrypoints": {
      "python": "validator:FraudSignalValidator"
    },
    "latency_class": "inline",
    "maintainer": "@you",
    "status": "python-only"
  }
}
```

Rules:

- `commit` must be a full 40-character SHA (not a branch or tag)
- `entrypoints` must contain **at least one** of `python` / `ts`
- `status` must be `python-only`, `ts-only`, or `both` and must match
  the declared entrypoints
- `parity_fixture` is **required** when both entrypoints are present,
  and **must be omitted** when only one language is present

Optionally update the catalog row in `registry/README.md` in the same PR.

## 3. What CI checks (and why PRs get rejected)

On any PR that touches `registry/index.json`, CI will:

1. Validate the entry against `registry/schema.json`
2. Enforce the commit-pin and language / parity rules above
3. Clone the pinned commit once into an ephemeral sandbox
4. For each declared entrypoint: import it, confirm it satisfies the
   `Validator` interface, confirm `latency_class` / `latencyClass`
5. **If both entrypoints are declared**: load `parity_fixture`, run
   `judge()` through both implementations against identical input, assert
   `score` matches within ±0.01 (or exact `label` match for label-based
   validators)
6. Reject the PR if the diff touches anything other than
   `registry/index.json` (and optionally `registry/README.md`)

## 4. Trust model

Galya does not vendor, audit, or take responsibility for third-party
validator code beyond automated schema / import / parity checks. Once
installed, a validator runs as arbitrary code with full access to
whatever the host process has — the same trust model as installing any
third-party pip/npm package.

`judge()` is read-only by contract (returns a score, cannot mutate the
context window) — a design guarantee, not a sandboxing one.

See [SECURITY.md](./SECURITY.md) for the full statement.

## 5. SDK development (maintainers only)

If you are changing the Python or TypeScript SDKs themselves (not
registering a validator):

```bash
# Python
pip install -e "packages/python[dev]"
pytest packages/python

# TypeScript
cd packages/ts && npm install && npm test
```
