# Galya Reality Docs

Fumadocs + Next.js documentation site for **@galya/reality**.

> **Agents:** use repo-root [`skills.md`](../skills.md) (or [Agent skills](/docs/skills) once the site is running) — includes Fumadocs `/llms.txt`, `.md`, and `/api/search` retrieval.

## Local development

```bash
cd docs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Import the [GalyaIntelligence/reality](https://github.com/GalyaIntelligence/reality) repo into Vercel.
2. Set **Root Directory** to `docs`.
3. Framework preset: **Next.js** (auto-detected).
4. Deploy.

`vercel.json` in this folder pins the install/build commands for that root.
