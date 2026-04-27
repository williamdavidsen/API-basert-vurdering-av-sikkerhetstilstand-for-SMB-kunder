# Coverage Report

## Backend

Coverage target:

- Service scoring and weighting logic.
- Controller happy paths and validation paths.
- DTO/entity mapping.

## Frontend

Coverage target:

- Score and grade utilities.
- Status mapping.
- Domain validation behavior.
- Dashboard mapper behavior.

## Notes

Backend Cobertura coverage was generated on 2026-04-27:

- API unit tests project aggregate coverage: line-rate `45.7%`, branch-rate `36.37%`
- API integration tests project aggregate coverage: line-rate `9.65%`, branch-rate `0.89%`
- Combined backend evidence: scoring, weighting, provider-failure handling, controller contracts, and error sanitization are all exercised by automated tests.

Frontend Istanbul coverage was generated on 2026-04-27 with `npm run test:coverage`:

- Statements: `65.78%` (`548/833`)
- Branches: `60.87%` (`473/777`)
- Functions: `65.48%` (`148/226`)
- Lines: `69.15%` (`491/710`)

The frontend percentages now confirm coverage for validation, dashboard mapping, top-level routing, shared layout behavior, threat-landscape rendering, PQC modal behavior, module-detail logic, scan progress routing, and API request construction. The largest remaining deterministic gaps are still concentrated in some helper hooks, carousel-only presentation components, last-scan storage helpers, and a few module-detail/report-generation paths.

Current automated execution evidence on 2026-04-27:

- API unit tests: 48 assertions passed across scoring, weighting, provider error handling, mapping, and edge-case module combinations.
- API integration tests: 31 assertions passed across happy paths, controller error paths, root-route availability, and error-message sanitization.
- Frontend unit tests: 45 assertions passed across score/status utilities, dashboard mapping, routing/layout behavior, threat-landscape rendering, PQC modal behavior, module details, domain validation behavior, scan progress flow, and assessment API request behavior.
- E2E tests: 12 Playwright flows passed, plus 1 opt-in skipped live smoke test, across scan start, dashboard rendering, partial-result messaging, module navigation, retry behavior, accessibility smoke coverage, and visual regression baselines.
