$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$apiBaseUrl = if ($args.Length -gt 0 -and $args[0]) { $args[0].TrimEnd('/') } else { 'http://localhost:1071' }
$domainFile = if ($args.Length -gt 1 -and $args[1]) { $args[1] } else { Join-Path $PSScriptRoot 'live-smoke-domains.txt' }

Write-Host "Running live validation against $apiBaseUrl"
Write-Host "Domain file: $domainFile"

dotnet run --project (Join-Path $repoRoot 'Test\AssessmentBatchRunner\AssessmentBatchRunner.csproj') -- $apiBaseUrl $domainFile
