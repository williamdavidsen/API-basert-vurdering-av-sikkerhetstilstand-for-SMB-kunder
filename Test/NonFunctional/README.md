# Non-Functional Smoke Tests

This folder contains lightweight scripts for performance, resilience, and operational smoke testing against a running API.

## Scripts

- `load-smoke.ps1`: fires concurrent assessment requests and reports latency/error-rate metrics.
- `resilience-smoke.ps1`: runs a mixed list of real and fake domains and checks that the API returns handled responses without crashing.

## Usage

Start the API first, then run:

```powershell
pwsh .\Test\NonFunctional\load-smoke.ps1
pwsh .\Test\NonFunctional\resilience-smoke.ps1
```
