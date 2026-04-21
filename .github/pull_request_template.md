## Summary

- What changed and why?

## Verification

- [ ] `npm run verify:release` passes locally
- [ ] CI `Verify Release` workflow is green
- [ ] Manual smoke check completed for touched pages/routes

## Security & Exposure Checklist

- [ ] No backend deployment fingerprints exposed (`commit`, deployment/replica IDs, env names)
- [ ] No raw connector/backend URLs exposed in user-facing UI
- [ ] No secrets or token-like values returned in public responses
- [ ] Operational endpoints keep hardening headers (`no-store`, `noindex`, `nosniff`, etc.)
- [ ] New/updated public routes are reviewed for sitemap/robots/indexing intent

## Notes

- Risks, follow-ups, or rollout notes
