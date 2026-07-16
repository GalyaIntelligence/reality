# Security Policy

## Trust model

Galya does **not** vendor, audit, or take responsibility for third-party
validator code beyond automated schema / import / parity checks. Once
installed, a validator runs as **arbitrary code** with full access to
whatever the host process has — the same trust model as installing any
third-party pip or npm package.

`judge()` is read-only by contract (returns a score and must not mutate
the context window). That is a **design guarantee, not a sandboxing
guarantee**.

## What v0 does and does not protect

### No dependency isolation

A validator's dependencies share the caller's environment. Version
conflicts are the integrator's problem. Per-validator isolation is out
of scope for v0.

### Sandboxed import is not a security boundary

The sandboxed import check (and the parity check when both languages are
present) only verifies that the code:

1. Loads without import errors
2. Satisfies the `Validator` interface
3. When both languages are declared: agrees on the fixture case(s)

It does **not** prevent a validator from making network calls, reading
local files, or exfiltrating context at runtime — that may be legitimate
(e.g. calling the validator's own model API). Mitigation is
**commit-pinning + registry review + maintainer trust**.

### `judge()` mutability

`judge()` must not mutate `Message` / `ContextWindow`. In v0 this is
enforced by convention and interface only, not runtime immutability.

### Parity check scope

A passing parity check only proves agreement on the fixture case(s)
provided, **not** full behavioral equivalence across all inputs.

## Reporting vulnerabilities

Report security issues privately to the Galya maintainers. Do not open
public issues for undisclosed vulnerabilities in the SDKs or registry
tooling.
