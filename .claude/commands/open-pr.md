---
description: Push the current branch and open a PR using the repo template
---

Open a pull request for the current branch, following this repo's standards.

Steps:

1. Run `git status` and `git branch --show-current`. If the current branch is `main`, stop and ask
   the user to move the work to a `feat/`|`fix/` branch first.
2. Ensure the working tree state is intended (uncommitted changes → offer to `/commit` first).
3. Verify locally before pushing: `npm run build && npm test`. Report failures instead of pushing.
4. **Confirm with the user before pushing** (this is an outward-facing action).
5. Push via SSH: `git push -u origin <branch>`.
6. Open the PR with `gh pr create`:
   - Title: a Conventional Commit style summary.
   - Body: fill in the `.github/PULL_REQUEST_TEMPLATE.md` sections (summary, type of change,
     related issues, how to test, checklist).
   - **Do NOT** add any AI/Claude attribution.
7. Print the PR URL.

$ARGUMENTS
