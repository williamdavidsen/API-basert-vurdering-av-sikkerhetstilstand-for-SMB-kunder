$ErrorActionPreference = 'Stop'

param(
  [string]$ApiBaseUrl = 'http://localhost:1071',
  [string]$MixedDomainFile = (Join-Path $PSScriptRoot '..\AssessmentBatchRunner\live-smoke-domains.txt'),
  [string]$FakeDomainFile = (Join-Path $PSScriptRoot '..\AssessmentBatchRunner\weak-domains.txt'),
  [int]$TimeoutSeconds = 30
)

$realDomains = Get-Content $MixedDomainFile | Where-Object { $_ -and -not $_.StartsWith('#') }
$fakeDomains = Get-Content $FakeDomainFile | Where-Object { $_ -and -not $_.StartsWith('#') } | Select-Object -First 5
$domains = @($realDomains + $fakeDomains)

$handler = [System.Net.Http.SocketsHttpHandler]::new()
$client = [System.Net.Http.HttpClient]::new($handler)
$client.BaseAddress = [Uri]($ApiBaseUrl.TrimEnd('/') + '/')
$client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)

$results = foreach ($domain in $domains) {
  try {
    $payload = @{ domain = $domain } | ConvertTo-Json
    $content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')
    $response = $client.PostAsync('api/assessment/check', $content).GetAwaiter().GetResult()
    [pscustomobject]@{
      Domain = $domain
      StatusCode = [int]$response.StatusCode
      Success = $response.IsSuccessStatusCode
    }
  }
  catch {
    [pscustomobject]@{
      Domain = $domain
      StatusCode = 0
      Success = $false
    }
  }
}

$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.StatusCode -eq 0 }
if ($failed.Count -gt 0) {
  throw "Resilience smoke failed because one or more requests did not return a handled HTTP response."
}
