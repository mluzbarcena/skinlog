# Contributing to Skinlog

Thanks for contributing! This guide covers the conventions and the day-to-day workflow.

## Prerequisites

- **Node.js 20+**
- **npm** (this repo uses `package-lock.json`; do not switch package managers)

## Setup

```bash
npm install
npm run dev
```

## Workflow (new feature or bug fix)

The flow is the same for features and fixes — only the branch and commit **prefix** changes
(`feat/` vs `fix/`).

1. **Branch off `main`** — never commit directly to `main`:
   ```bash
   git checkout -b feat/<slug>   # or: fix/<slug>
   ```
2. **Make the change.** AI agents automatically read `AGENTS.md` for project context; keep personal
   notes in the gitignored `AGENTS.local.md`. Remember the **i18n sync rule** (see below).
3. **Verify locally:**
   ```bash
   npm run build && npm test
   ```
4. **Commit** using Conventional Commits (in Claude Code you can use `/commit`).
5. **Open a PR** (in Claude Code you can use `/open-pr`). Fill in the PR template.
6. **CI runs** on the PR (`.github/workflows/ci.yml`): type-check + build + tests.
7. **Squash-merge** to `main` → `deploy.yml` publishes to GitHub Pages.

## Commit messages — Conventional Commits

Format: `type(optional-scope): short imperative summary`

Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

Examples:

```
feat: add nightly routine reminder
fix: correct phase 1→2 transition date
docs: document i18n sync rule
refactor(domain): extract suggestNight helper
test: cover empty-day cleanup
chore: bump vite to 6.x
```

**Do not** add AI/assistant attribution or `Co-Authored-By` trailers to commits or PRs.

## i18n sync rule

Any change to user-facing text **must update both** `src/i18n/es.ts` **and** `src/i18n/en.ts`,
keeping their keys in sync. The `i18n-guardian` agent can audit the two dictionaries for drift.

## Testing

- Tests use **Vitest** and live in `src/**/*.test.{ts,tsx}`.
- Business logic in `src/domain/` should be covered by unit tests.
- Keep the suite green (`npm test`) before opening a PR.

## Where to change things

- Business rules / data (products, routines, thresholds, defaults): `src/domain/config.ts`
- Phase logic and night suggestions: `src/domain/logic.ts`
- Persistence / schema migrations: `src/domain/storage.ts` (`migrate()`)
- UI text: `src/i18n/es.ts` + `src/i18n/en.ts`

Never hand-edit `dist/` or `skinlog-dist.zip` — they are build artifacts.
