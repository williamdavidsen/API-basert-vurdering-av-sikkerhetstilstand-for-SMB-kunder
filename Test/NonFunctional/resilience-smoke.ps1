param(
  [string]$ApiBaseUrl = 'http://localhost:1071',
  [string]$MixedDomainFile = (Join-Path $PSScriptRoot '..\AssessmentBatchRunner\live-smoke-domains.txt'),
  [string]$FakeDomainFile = (Join-Path $PSScriptRoot '..\AssessmentBatchRunner\weak-domains.txt'),
  [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http

function Read-DomainList {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  return @(Get-Content $Path | ForEach-Object { "$_".Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') })
}

$realDomains = Read-DomainList -Path $MixedDomainFile
$fakeDomains = Read-DomainList -Path $FakeDomainFile | Select-Object -First 5
$domainTargets = @(
  $realDomains | ForEach-Object {
    [pscustomobject]@{
      Domain = $_
      ExpectedSuccess = $true
    }
  }
  $fakeDomains | ForEach-Object {
    [pscustomobject]@{
      Domain = $_
      ExpectedSuccess = $false
    }
  }
)

$handler = [System.Net.Http.HttpClientHandler]::new()
$client = [System.Net.Http.HttpClient]::new($handler)
$client.BaseAddress = [Uri]($ApiBaseUrl.TrimEnd('/') + '/')
$client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)

$results = foreach ($target in $domainTargets) {
  try {
    $payload = @{ domain = $target.Domain } | ConvertTo-Json
    $content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')
    $response = $client.PostAsync('api/assessment/check', $content).GetAwaiter().GetResult()
    $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    [pscustomobject]@{
      Domain = $target.Domain
      ExpectedSuccess = $target.ExpectedSuccess
      StatusCode = [int]$response.StatusCode
      Success = $response.IsSuccessStatusCode
      Body = $body
    }
  }
  catch {
    [pscustomobject]@{
      Domain = $target.Domain
      ExpectedSuccess = $target.ExpectedSuccess
      StatusCode = 0
      Success = $false
      Body = $_.Exception.Message
    }
  }
}

$results | Select-Object Domain, ExpectedSuccess, StatusCode, Success | Format-Table -AutoSize

$transportFailures = $results | Where-Object { $_.StatusCode -eq 0 }
if ($transportFailures.Count -gt 0) {
  throw "Resilience smoke failed because one or more requests did not return a handled HTTP response."
}

$realFailures = $results | Where-Object { $_.ExpectedSuccess -and -not $_.Success }
if ($realFailures.Count -gt 0) {
  $summary = ($realFailures | ForEach-Object { "$($_.Domain) => HTTP_$($_.StatusCode)" }) -join '; '
  throw "Resilience smoke failed because expected-live domains did not succeed: $summary"
}
