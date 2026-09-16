---
description: Create a Conventional Commit from the current changes
---

Create a git commit for the current changes, following this repo's standards.

Steps:

1. Run `git status` and `git diff` (staged and unstaged) to understand what changed.
2. If nothing is staged, stage the relevant files with `git add` (do not blindly `git add -A` if
   there are unrelated changes — ask if ambiguous).
3. Write a **Conventional Commit** message:
   - Format: `type(optional-scope): short imperative summary`
   - Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
   - Add a short body only if it adds real context.
4. **Do NOT** add any AI/Claude attribution or `Co-Authored-By` trailer.
5. Reminder: if UI text changed, both `src/i18n/es.ts` and `src/i18n/en.ts` must be updated — flag
   it if only one changed.
6. Create the commit. If on `main`, warn the user and offer to create a `feat/`|`fix/` branch first.

$ARGUMENTS
