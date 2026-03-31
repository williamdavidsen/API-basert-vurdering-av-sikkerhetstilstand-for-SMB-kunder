# Security Assessment API for SMB Customers

This project is an ASP.NET Core API for assessing the security posture of a domain. It is built as a bachelor project and is designed to give small and medium-sized business customers a simple, structured security overview based on several technical checks.

## What the project does

The API evaluates a target domain and produces a combined assessment score with grades, statuses, module-level scoring, and alerts.

The current assessment includes:

- SSL/TLS analysis
- HTTP security header analysis
- Email security analysis
- Reputation analysis
- PQC readiness analysis

## Main API modules

The API exposes dedicated endpoints for each module and one combined assessment endpoint:

- `/api/assessment/check/{domain}`
- `/api/ssl/check/{domain}`
- `/api/headers/check/{domain}`
- `/api/email/check/{domain}`
- `/api/reputation/check/{domain}`
- `/api/pqc/check/{domain}`

## Project structure

- `API/Controllers/Api` contains the REST API controllers
- `API/Services` contains the core assessment logic and external service clients
- `API/DTOs` contains request and response models
- `API/DAL` contains data access and repository code
- `Test/AssessmentBatchRunner` contains a small batch runner for testing many domains

## Running the project

From the `API` folder:

```powershell
$env:ASPNETCORE_URLS="http://localhost:5555"
dotnet run --project .\SecurityAssessmentAPI.csproj --no-launch-profile
```

Swagger UI:

```text
http://localhost:5555/swagger
```

OpenAPI JSON:

```text
http://localhost:5555/swagger/v1/swagger.json
```

## Notes

- The project depends on external services and network-based checks.
- Some modules use third-party APIs and HTTP/DNS lookups.
- Output quality depends on network availability and the quality of upstream data sources.

## Purpose

The goal of the project is to provide a practical API-based security assessment workflow that can be used as a basis for customer-facing evaluation, experimentation, and further development.
