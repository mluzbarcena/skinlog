---
description: Cut a versioned release (bump, changelog, tag, GitHub Release) via a PR to main
---

Cut a new release for this project, following the repo's standards.

Releases are **manual and versioned** (deploys to Pages happen automatically on every push to
`main`; a release is a separate, tagged milestone). Argument: the bump type or explicit version —
`patch` | `minor` | `major` | `vX.Y.Z` (default `patch`).

> **`main` is protected by a ruleset that requires a pull request** — direct `git push origin main`
> is rejected (`GH013: repository rule violations`). So a release is prepared on a
> `release/vX.Y.Z` branch, merged via PR, and only then tagged on the merged `main`.

Steps:

1. Ensure the working tree is clean and you are on `main`, fully up to date:
   `git checkout main && git pull`. If not clean, stop and report.
2. Confirm the changes to release are already merged into `main` (check `git log` since the last
   tag: `git log $(git describe --tags --abbrev=0)..HEAD --oneline`).
3. **Confirm the target version with the user before proceeding** (this is outward-facing). Derive
   a sensible default from the commits since the last tag (a `feat` → `minor`, otherwise `patch`).
4. Create the release branch: `git checkout -b release/vX.Y.Z`.
5. Update every file that names the version/release, then commit as `chore: release vX.Y.Z`:
   - **`package.json` (+ lockfile)**: `npm version <patch|minor|major|X.Y.Z> --no-git-tag-version`
     (bumps without committing or tagging — the tag is created later on merged `main`).
   - **`CHANGELOG.md`**: add a new `## [X.Y.Z] - YYYY-MM-DD` section (grouped Added / Changed /
     Fixed as applicable) summarizing what shipped since the last tag, plus its link reference at
     the bottom.
   - **`README.md`**: update the version in the title (`# Skinlog — vX.Y.Z`) and any docs affected
     by the release (e.g. feature sections, the component/file-structure list).
   - **Any other file that names the version** (docs under `specs/`, etc.). Grep for the previous
     version string to catch stragglers: `git grep -n "v<old>\|<old>"`.
   - **Do NOT** add any AI/Claude attribution to the commit.
6. Verify locally: `npm run build && npm test`. Report failures instead of releasing.
7. Push the branch and open the PR (title `chore: release vX.Y.Z`, fill the template), then
   **squash-merge** it into `main` (the ruleset requires 0 approvals, so self-merge is allowed):
   `git push -u origin release/vX.Y.Z` → `gh pr create …` → `gh pr merge --squash --delete-branch`.
8. Update local `main` and tag the merged commit, then push the tag (tags are not blocked by the
   branch ruleset): `git checkout main && git pull` → `git tag -a vX.Y.Z -m "vX.Y.Z"` →
   `git push origin vX.Y.Z`.
9. Create the GitHub Release: `gh release create vX.Y.Z --generate-notes --verify-tag`
   (optionally `--title` with a short summary).
10. Print the release URL. Note that merging to `main` also triggers the Pages deploy
    (`.github/workflows/deploy.yml`).

$ARGUMENTS
