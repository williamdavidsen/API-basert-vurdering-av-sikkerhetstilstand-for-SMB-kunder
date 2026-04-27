# Test Execution Log

| Date | Tester | Command / Activity | Result | Notes |
|---|---|---|---|---|
| 2026-04-19 | Codex | `dotnet test Test/API.UnitTests/API.UnitTests.csproj --no-restore` | Passed | 7 passed |
| 2026-04-19 | Codex | `dotnet test Test/API.IntegrationTests/API.IntegrationTests.csproj --no-restore` | Passed | 2 passed |
| 2026-04-19 | Codex | `npm test` in `Test/Frontend.UnitTests` | Passed | 8 passed |
| 2026-04-19 | Codex | `npm test -- --reporter=line --workers=1` in `Test/E2E` | Passed | 2 passed |
| 2026-04-27 | Codex | `dotnet test Test/API.UnitTests/API.UnitTests.csproj --no-restore` | Passed | 46 passed |
| 2026-04-27 | Codex | `dotnet test Test/API.IntegrationTests/API.IntegrationTests.csproj --no-restore` | Passed | 23 passed |
| 2026-04-27 | Codex | `npx vitest run src/assessment/assessment.mappers.test.ts` in `Test/Frontend.UnitTests` | Passed | 6 passed after updating the HTTP Headers card expectation |
| 2026-04-27 | Codex | `npm test` in `Test/Frontend.UnitTests` | Passed | 17 passed with `vitest run --pool=threads` |
| 2026-04-27 | Codex | `npm test -- --reporter=line --workers=1` in `Test/E2E` | Passed | 5 passed |
| 2026-04-27 | Codex | `dotnet test Test/API.UnitTests/API.UnitTests.csproj --no-restore -m:1` | Passed | 46 passed after disabling shared compilation for test stability |
| 2026-04-27 | Codex | `dotnet test Test/API.IntegrationTests/API.IntegrationTests.csproj --no-restore -m:1` | Passed | 23 passed after disabling shared compilation for test stability |
| 2026-04-27 | Codex | `npm test -- src/shared/domain.test.ts src/pages/HomePage.test.tsx` in `Test/Frontend.UnitTests` | Passed | 6 passed for domain normalization and invalid input validation |
| 2026-04-27 | Codex | `npm test` in `Test/Frontend.UnitTests` | Passed | 23 passed with `vitest.config.mjs`, `maxWorkers: 1`, and heap cap |
| 2026-04-27 | Codex | `npm test -- --reporter=line --workers=1` in `Test/E2E` | Passed | 5 passed with `playwright.config.mjs` and heap-capped Vite startup |
| 2026-04-27 | Codex | `npm test -- src/pages/ScanProgressPage.test.tsx src/assessment/assessment.api.test.ts` in `Test/Frontend.UnitTests` | Passed | 6 passed for scan progress navigation and assessment API request behavior |
| 2026-04-27 | Codex | `npm test` in `Test/Frontend.UnitTests` | Passed | 29 passed after adding scan progress and API service coverage |
| 2026-04-27 | Codex | `dotnet test Test/API.UnitTests/API.UnitTests.csproj --no-restore -m:1` | Passed | 48 passed after adding edge-case module combination coverage |
| 2026-04-27 | Codex | `npm run test:update-snapshots -- --reporter=line --workers=1` in `Test/E2E` | Passed | 9 passed and 1 skipped after adding accessibility smoke, visual regression baseline, and opt-in live full-stack smoke coverage |
| 2026-04-27 | Codex | `dotnet test Test/API.UnitTests/API.UnitTests.csproj --no-restore -m:1 --collect:"XPlat Code Coverage"` | Passed | Cobertura XML generated for backend unit coverage |
| 2026-04-27 | Codex | `dotnet test Test/API.IntegrationTests/API.IntegrationTests.csproj --no-restore -m:1 --collect:"XPlat Code Coverage"` | Passed | Cobertura XML generated for backend integration coverage |
| 2026-04-27 | Codex | `npm run test:coverage` in `Test/Frontend.UnitTests` | Passed | Frontend Istanbul coverage generated: statements 51.98%, branches 46.58%, functions 45.13%, lines 54.22% |
| 2026-04-27 | Codex | `npm run test:update-snapshots -- --reporter=line --workers=1` in `Test/E2E` | Passed | 12 passed and 1 skipped after resolving remaining accessibility color-contrast issues and refreshing snapshots |
| 2026-04-27 | Codex | `dotnet test Test/API.UnitTests/API.UnitTests.csproj --no-restore -m:1` | Passed | 48 passed in the final verification run |
| 2026-04-27 | Codex | `dotnet test Test/API.IntegrationTests/API.IntegrationTests.csproj --no-restore -m:1` | Passed | 31 passed in the final verification run |
| 2026-04-27 | Codex | `npm test` in `Test/Frontend.UnitTests` | Passed | 29 passed in the final verification run |
| 2026-04-27 | Codex | `npm test` in `Test/Frontend.UnitTests` | Passed | 41 passed after adding router, top bar, threat landscape, and module detail coverage |
| 2026-04-27 | Codex | `npm run test:coverage` in `Test/Frontend.UnitTests` | Passed | Frontend Istanbul coverage improved to statements 64.46%, branches 60.23%, functions 62.38%, lines 67.6% |
| 2026-04-27 | Codex | `npm test` in `Test/Frontend.UnitTests` | Passed | 45 passed after adding home container, app provider, and PQC modal coverage |
| 2026-04-27 | Codex | `npm run test:coverage` in `Test/Frontend.UnitTests` | Passed | Frontend Istanbul coverage improved to statements 65.78%, branches 60.87%, functions 65.48%, lines 69.15% |
