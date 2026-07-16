---
name: galya-reality
description: >-
  Use Galya Reality validators from Python or TypeScript — resolve catalog
  names, call index()/judge(), read ValidationResult, and wire Mastra or
  LangGraph. Also retrieve this project's Fumadocs docs via llms.txt, markdown
  endpoints, and search. Use when integrating Galya Reality, scoring agent
  output, writing validators, or answering questions from the official docs.
---

# Galya Reality

> Canonical copy also lives at the repo root: [`skills.md`](../../../skills.md). Prefer that path when pointing agents at a single URL.

Better agent judgement — move from instinct to reality grounded intuition for clearer insights.

## Packages

| Language | Package | Factory |
|----------|---------|---------|
| Python | `galya-reality` | `reality.validator(name)` (sync) |
| TypeScript | `@galya/reality` | `await validator(name)` (async) |

One catalog name → one singleton client. No multi-validator fan-out.

## Core API

```text
validator(name) → client
client.index(message, context)  → void
client.judge(message, context)  → ValidationResult { score, label?, rationale?, explanations?, metadata? }
```

- **`index`** — observe / stream context (may be a no-op for stateless validators)
- **`judge`** — score; **must not** mutate message/context
- Prefer **`explanations`** when you need structured reasons; `rationale` is a single summary

Types: `Message` (`role`, `content`, `metadata?`), `ContextWindow` (`messages`, `metadata?`).

## Env

| Variable | Purpose |
|----------|---------|
| `GALYA_AUTO_INSTALL=1` | Skip install confirmation |
| `GALYA_REGISTRY_URL` | Custom catalog URL |
| `GALYA_CACHE_DIR` | Cache override |

## Integrations (examples in repo)

- **Mastra** — `examples/mastra` — `createGalyaScorer` on your Agent’s `scorers` (`OPENAI_API_KEY` for live agent)
- **LangGraph** — `examples/langgraph` — `make_galya_index_node` / `make_galya_judge_node` in your graph (`OPENAI_API_KEY` for live draft)

## Write / register a validator

Validators live in **their own repos**. Templates: `examples/write_your_own_validator/`. Register with a PR to `registry/index.json` (pinned 40-char SHA, language `status`, parity fixture when both langs). See `CONTRIBUTING.md` and docs → Validators.

## Read Galya docs (Fumadocs)

This site is **Fumadocs**-powered (same pattern as [Fumadocs `read-docs`](https://agentskills.so/skills/fuma-nama-fumadocs-read-docs)). Do **not** scrape HTML. Use:

1. **Page index** — `GET {docsBase}/llms.txt`
2. **Page markdown** (preferred) — `GET {docsBase}/docs/{slug}.md`  
   or `GET {docsBase}/llms.mdx/docs/{slug}/content.md`
3. **Search** — `GET {docsBase}/api/search?query=...`

Examples (local):

- `http://localhost:3000/llms.txt`
- `http://localhost:3000/docs/capabilities/api-model.md`
- `http://localhost:3000/api/search?query=judge`

In-repo MDX (offline): `docs/content/docs/**/*.mdx`

Doc sections: **Capabilities** (API model, `index()`, `judge()`), **Validators**, **Integrations**, Configuration, Security.

## Rules of thumb

- Cite rendered `/docs/...` URLs for humans; reason from `.md` / MDX sources.
- If a validator name isn’t available in the caller’s language, expect `LanguageNotSupportedError`.
- Treat installed validators as third-party code (same trust model as pip/npm) — see `SECURITY.md`.
