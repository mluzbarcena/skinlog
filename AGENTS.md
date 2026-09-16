# AGENTS.md

Guidance for AI agents (Claude Code, Codex, etc.) working in this repository.
This is the canonical context file. `CLAUDE.md` is a symlink to it.

## Overview

**Skinlog** is a personal skincare-routine tracker. It is:

- **Offline-first**: no backend, no network calls, no accounts. All data lives in the browser's
  `localStorage` under a single key.
- **Bilingual** (Spanish / English) with runtime language switching.
- **Dark-mode** aware (auto / light / dark).
- Shipped as a **static PWA**, deployed to GitHub Pages.

## Stack

- React 19 + Vite 6
- TypeScript 5.7 (strict mode; `noUnusedLocals`, `noUnusedParameters`, etc.)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- Vitest 3 for tests
- Package manager: **npm** (`package-lock.json`, lockfile v3). Requires **Node 20+**.

## Commands

| Task                | Command                          |
| ------------------- | -------------------------------- |
| Dev server          | `npm run dev`                    |
| Production build    | `npm run build` (`tsc -b && vite build`) |
| Preview built app   | `npm run preview`                |
| Run tests once      | `npm test`                       |
| Tests in watch mode | `npm run test:watch`             |

Tests live in `src/**/*.test.{ts,tsx}` and run in a `node` environment.

## Architecture

Clean separation of concerns (mirrors the README):

- `src/domain/` — **pure business logic**, no React. Types, config, date helpers, core logic,
  storage. Ideal target for unit tests.
  - `config.ts` — products, routines, night types, tolerance scale, warning thresholds, defaults.
  - `logic.ts` — phase 1→2 transition (`hyaluFinishedDate`) and the `suggestNight()` algorithm.
  - `storage.ts` — persistence + `migrate()`.
  - `dates.ts`, `types.ts`.
- `src/state/` — React bindings (`useStore`, `useTheme`).
- `src/i18n/` — translation dictionaries (`es.ts`, `en.ts`), `format.ts`, `useI18n.ts`.
- `src/components/` — reusable UI (Topbar, NavBar, LanguageSwitcher, Icon, Toast, DayEditor).
- `src/views/` — page views (Today, Calendar, Progress, Phases, Settings).
- `src/test/` — Vitest tests.
- `legacy/` — the original vanilla-JS app, **reference only. Do not modify.**

## Key rules for editing

- **Business rules** belong in `src/domain/config.ts` — change data/thresholds there, not in views.
- **Phase logic** (1→2 transition, night suggestions) lives in `src/domain/logic.ts`.
- **Persistence**: a single `localStorage` key `skincareTracker:v1`. Schema changes must go through
  `migrate()` in `src/domain/storage.ts`.
- **i18n sync (important)**: any UI string change **must update BOTH `src/i18n/es.ts` and
  `src/i18n/en.ts`** — keys must stay in sync. Run the `i18n-guardian` agent if unsure.
- Never hand-edit `dist/` or `skinlog-dist.zip` — they are build artifacts.

## Conventions

- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Do not add AI/Claude attribution** or `Co-Authored-By` trailers to commits or PRs.
- Branch off `main`; open a PR; **squash-merge**. CI (`.github/workflows/ci.yml`) type-checks,
  builds, and tests every PR. Merging to `main` triggers the Pages deploy.
- Keep tests green (`npm test`) before opening a PR.

See `CONTRIBUTING.md` for the full contributor workflow.

@AGENTS.local.md
