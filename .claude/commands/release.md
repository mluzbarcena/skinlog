---
description: Cut a versioned release (bump, tag, GitHub Release) from main
---

Cut a new release for this project, following the repo's standards.

Releases are **manual and versioned** (deploys to Pages happen automatically on every push to
`main`; a release is a separate, tagged milestone). Argument: the bump type or explicit version —
`patch` | `minor` | `major` | `vX.Y.Z` (default `patch`).

Steps:

1. Ensure the working tree is clean and you are on `main`, fully up to date:
   `git checkout main && git pull`. If not clean, stop and report.
2. Confirm the changes to release are already merged into `main` (check `git log` since the last
   tag: `git log $(git describe --tags --abbrev=0)..HEAD --oneline`).
3. Verify locally: `npm run build && npm test`. Report failures instead of releasing.
4. **Confirm the target version with the user before tagging** (this is outward-facing).
5. Bump + tag with npm (keeps `package.json` and the tag in sync):
   `npm version <patch|minor|major|X.Y.Z>` — this creates a commit and a `vX.Y.Z` tag.
   - **Do NOT** add any AI/Claude attribution.
6. Push the commit and tag: `git push origin main --follow-tags`.
7. Create the GitHub Release: `gh release create vX.Y.Z --generate-notes --verify-tag`.
   - Optionally set `--title` to a short summary.
8. Print the release URL. Note that pushing to `main` also triggers the Pages deploy
   (`.github/workflows/deploy.yml`).

$ARGUMENTS
