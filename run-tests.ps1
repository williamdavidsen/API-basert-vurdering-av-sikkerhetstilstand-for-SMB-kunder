$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path $PSScriptRoot
$testResults = @()

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,
        [Parameter(Mandatory = $true)]
        [string] $Tool,
        [Parameter(Mandatory = $true)]
        [string] $Focus,
        [Parameter(Mandatory = $true)]
        [string] $Count,
        [Parameter(Mandatory = $true)]
        [scriptblock] $Action
    )

    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    try {
        & $Action
        $script:testResults += [pscustomobject]@{
            Name = $Name
            Tool = $Tool
            Focus = $Focus
            Count = $Count
            Status = 'PASSED'
        }
        Write-Host "Result: PASSED" -ForegroundColor Green
    }
    catch {
        $script:testResults += [pscustomobject]@{
            Name = $Name
            Tool = $Tool
            Focus = $Focus
            Count = $Count
            Status = 'FAILED'
        }
        Write-Host "Result: FAILED" -ForegroundColor Red
        throw
    }
}

function Write-TestSummary {
    Write-Host ""
    Write-Host "=== Test summary ===" -ForegroundColor Cyan
    Write-Host ("{0,-32} {1,-18} {2,-28} {3,-10} {4}" -f 'Test area', 'Tool', 'Focus', 'Count', 'Result') -ForegroundColor White
    Write-Host ("{0,-32} {1,-18} {2,-28} {3,-10} {4}" -f ('-' * 9), ('-' * 4), ('-' * 5), ('-' * 5), ('-' * 6)) -ForegroundColor DarkGray

    foreach ($result in $script:testResults) {
        $color = if ($result.Status -eq 'PASSED') { 'Green' } else { 'Red' }
        Write-Host ("{0,-32} {1,-18} {2,-28} {3,-10} {4}" -f $result.Name, $result.Tool, $result.Focus, $result.Count, $result.Status) -ForegroundColor $color
    }
}

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock] $Command
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE."
    }
}

$env:DOTNET_CLI_HOME = Join-Path $repoRoot '.dotnet-cli-home'
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'

$suiteFailed = $false

try {
    Invoke-Step -Name "API unit tests" -Tool "xUnit/.NET" -Focus "Service logic/scoring" -Count "55 tests" -Action {
        Invoke-CheckedCommand {
            dotnet test (Join-Path $repoRoot 'Test\API.UnitTests\API.UnitTests.csproj') -m:1 -p:UseAppHost=false --artifacts-path (Join-Path $repoRoot 'artifacts\test-run\api-unit')
        }
    }

    Invoke-Step -Name "API integration smoke tests" -Tool "xUnit/TestHost" -Focus "API contract/assessment" -Count "3 tests" -Action {
        Invoke-CheckedCommand {
            dotnet test (Join-Path $repoRoot 'Test\API.IntegrationTests\API.IntegrationTests.csproj') -m:1 -p:UseAppHost=false --artifacts-path (Join-Path $repoRoot 'artifacts\test-run\api-integration')
        }
    }

    Invoke-Step -Name "Frontend unit tests" -Tool "Vitest" -Focus "Mapping/validation" -Count "14 tests" -Action {
        Push-Location (Join-Path $repoRoot 'Test\Frontend.UnitTests')
        try {
            Invoke-CheckedCommand {
                npm test
            }
        }
        finally {
            Pop-Location
        }
    }

    Invoke-Step -Name "E2E smoke test" -Tool "Playwright" -Focus "Main scan flow" -Count "1 test" -Action {
        Push-Location (Join-Path $repoRoot 'Test\E2E')
        try {
            Invoke-CheckedCommand {
                npm test
            }
        }
        finally {
            Pop-Location
        }
    }
}
catch {
    $suiteFailed = $true
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-TestSummary

Write-Host ""
if ($suiteFailed) {
    Write-Host "Reduced test suite failed." -ForegroundColor Red
    exit 1
}

Write-Host "Test suite completed successfully." -ForegroundColor Green
