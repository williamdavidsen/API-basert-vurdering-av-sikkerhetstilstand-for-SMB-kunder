# Security Assessment Platform for SMB Customers

Bachelor project repository for an API-based security assessment platform for small and medium-sized businesses. The project combines an ASP.NET Core backend with a React dashboard to evaluate a domain across several security-related modules and present the result in a structured, user-facing interface.

## Project Summary

The purpose of this project is to explore how automated security checks can be collected, interpreted, and presented in a way that is understandable for SMB customers. A user enters a domain name in the dashboard, and the system runs a combined assessment based on SSL/TLS, HTTP security headers, email security, reputation data, and post-quantum cryptography readiness indicators.

The application is intended as a practical bachelor project prototype. It is not a replacement for a professional penetration test, security audit, or compliance assessment.

## Scope

The current implementation includes:

- SSL/TLS analysis based on SSL Labs data
- HTTP security header analysis based on direct header inspection and Mozilla Observatory data when available
- Email security analysis based on DNS records such as SPF, DKIM, and DMARC
- Reputation analysis based on DNS resolution and VirusTotal data when an API key is configured
- PQC readiness analysis based on TLS protocol, cipher suite, and named group information
- A combined assessment endpoint that aggregates module results into a score, grade, status, alerts, and dashboard-oriented response model
- A React dashboard for starting a scan and viewing module-level results

## Technology Stack

- Backend: ASP.NET Core, C#, .NET 10
- API documentation: Swagger / OpenAPI
- Data storage: Entity Framework Core in-memory database
- Frontend: React, TypeScript, Vite, Material UI
- Tests: xUnit, ASP.NET Core TestHost, Vitest, Playwright

## Repository Structure

```text
API/
  Controllers/Api/        REST API controllers
  DAL/                    In-memory data context and repositories
  DTOs/                   Request and response models
  Services/               Assessment logic and external service clients

Frontend/
  package.json            Convenience scripts for the dashboard app
  dashboard/              React, TypeScript, Vite dashboard

Test/
  API.UnitTests/          Backend unit tests
  API.IntegrationTests/   API smoke/integration tests
  Frontend.UnitTests/     Frontend mapping and validation tests
  E2E/                    Playwright smoke test
  ManualTests/            Manual delivery checklist
  Reports/                Short test report

run-tests.ps1             Combined reduced test suite
global.json               .NET SDK selection
```

## Requirements

- .NET SDK 10.0.x. The repository contains `global.json` with SDK version `10.0.201` and `rollForward` set to `latestFeature`.
- Node.js compatible with the frontend tooling. Node.js 22 LTS is recommended. The Vite version used by the project requires Node.js `^20.19.0` or newer compatible releases.
- npm.
- Internet access for live external checks, package restore, and frontend package installation.

## Configuration

The backend can run without a local configuration file. Reputation checks are more complete when a VirusTotal API key is configured.

Recommended local-only configuration file:

```text
API/appsettings.Local.json
```

Example:

```json
{
  "VirusTotal": {
    "ApiKey": "your-api-key"
  }
}
```

The same value can also be supplied through an environment variable:

```powershell
$env:VirusTotal__ApiKey = "your-api-key"
```

Do not commit real API keys or local secrets.

## Running the Application

Install the frontend dependencies once:

```powershell
cd .\Frontend
npm run setup
```

Start the frontend development environment:

```powershell
npm run dev
```

This forwards to `Frontend/dashboard`. The dashboard development script starts the API on `http://localhost:1072` if it is not already running, then starts the Vite frontend on:

```text
http://localhost:5187
```

The frontend proxies `/api` requests to:

```text
http://localhost:1072
```

If the API should run on another URL, set `VITE_DEV_API_PROXY` in `Frontend/dashboard/.env.development`.

## Running the API Separately

From the repository root:

```powershell
dotnet run --project .\API\SecurityAssessmentAPI.csproj --launch-profile http
```

Or from the `API` folder:

```powershell
dotnet run --project .\SecurityAssessmentAPI.csproj --launch-profile http
```

Default API URLs:

```text
API:          http://localhost:1072
Swagger UI:   http://localhost:1072/swagger
OpenAPI JSON: http://localhost:1072/swagger/v1/swagger.json
```

## Main API Endpoints

```text
GET /api/assessment/check/{domain}
GET /api/ssl/check/{domain}
GET /api/ssl/details/{domain}
GET /api/headers/check/{domain}
GET /api/email/check/{domain}
GET /api/reputation/check/{domain}
GET /api/pqc/check/{domain}
GET /
```

## Testing

Install test dependencies before running frontend and E2E tests:

```powershell
cd .\Test\Frontend.UnitTests
npm ci

cd ..\E2E
npm ci
npx playwright install chromium
```

Run the complete reduced test suite from the repository root:

```powershell
.\run-tests.ps1
```

Or use the npm shortcut:

```powershell
npm run test:all
```

The combined suite covers:

- 55 backend unit tests
- 3 backend integration smoke tests
- 14 frontend unit tests
- 1 Playwright E2E smoke test for the main scan flow

The test strategy is intentionally reduced for delivery. It protects the central scoring logic, API contract shape, frontend mapping/validation, and the main scan flow.

## External Services and Data Quality

The application depends on external systems and network behavior:

- SSL Labs for TLS and certificate analysis
- Mozilla Observatory when available for HTTP header assessment
- DNS lookups for email and domain resolution checks
- VirusTotal for reputation data when an API key is configured
- Direct HTTP requests for header probing

Because these sources are external, results can vary over time and may be affected by rate limits, network availability, provider downtime, or incomplete upstream data.

## Limitations

- The database is in-memory and is not intended for persistent production storage.
- The scoring model is a bachelor project implementation and should be interpreted as a prototype.
- A clean or high score does not prove that a domain is secure.
- Missing external data is handled defensively, but it can reduce assessment precision.
- The project focuses on a selected set of observable domain-level indicators and does not inspect internal infrastructure, application source code, identity systems, or organizational processes.

## Delivery Notes

Generated dependencies and build outputs are intentionally excluded from the repository and should not be included in delivery zip files:

```text
.git/
.vs/
.vscode/
.idea/
.dotnet-cli-home/
artifacts/
**/.artifacts/
**/bin/
**/obj/
**/node_modules/
**/dist/
**/test-results/
**/playwright-report/
coverage/
TestResults/
*.log
*.tmp
*.temp
```

The package lock files should remain in the repository. They make npm installation more reproducible while still allowing the recipient to install dependencies locally.

## Academic Context

For bachelor project delivery, this README is intended to document:

- what the system does
- how the source code is organized
- how to configure and run the application
- how to execute the reduced validation suite
- which assumptions and limitations apply

Detailed theoretical background, methodology, discussion, and evaluation should remain in the bachelor thesis/report itself. This repository README focuses on reproducibility and technical handover.
