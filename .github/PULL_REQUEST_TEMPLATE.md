<!-- Keep the title as a Conventional Commit summary, e.g. "feat: add nightly reminder" -->

## Summary

<!-- What does this PR do and why? 1-3 sentences. -->

## Type of change

<!-- Mirrors Conventional Commit types. Check all that apply. -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `refactor` — code change that neither fixes a bug nor adds a feature
- [ ] `test` — adding or updating tests
- [ ] `chore` — tooling, config, or maintenance

## Related issues

<!-- e.g. Closes #123 -->

## How to test

```bash
npm ci
npm run build
npm test
# npm run dev  # to try it in the browser
```

<!-- Add any manual steps to verify the change. -->

## Checklist

- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] If UI text changed, **both** `src/i18n/es.ts` and `src/i18n/en.ts` were updated (keys in sync)
- [ ] No secrets committed; `dist/` and `skinlog-dist.zip` not hand-edited
