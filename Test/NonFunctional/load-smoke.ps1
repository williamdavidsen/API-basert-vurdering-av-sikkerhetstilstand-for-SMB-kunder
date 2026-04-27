$ErrorActionPreference = 'Stop'

param(
  [string]$ApiBaseUrl = 'http://localhost:1071',
  [string]$Domain = 'example.com',
  [int]$Requests = 24,
  [int]$Concurrency = 6,
  [int]$TimeoutSeconds = 30,
  [double]$MaxFailureRatePercent = 5,
  [int]$MaxP95Ms = 5000
)

$handler = [System.Net.Http.SocketsHttpHandler]::new()
$handler.PooledConnectionLifetime = [TimeSpan]::FromMinutes(2)
$client = [System.Net.Http.HttpClient]::new($handler)
$client.BaseAddress = [Uri]($ApiBaseUrl.TrimEnd('/') + '/')
$client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)

$batches = [Math]::Ceiling($Requests / [double]$Concurrency)
$durations = New-Object System.Collections.Generic.List[double]
$failures = 0

for ($batch = 0; $batch -lt $batches; $batch++) {
  $tasks = @()

  for ($i = 0; $i -lt $Concurrency; $i++) {
    $requestIndex = ($batch * $Concurrency) + $i
    if ($requestIndex -ge $Requests) { break }

    $tasks += [System.Threading.Tasks.Task[object]]::Run([Func[object]]{
      $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
      try {
        $payload = @{ domain = $Domain } | ConvertTo-Json
        $content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')
        $response = $client.PostAsync('api/assessment/check', $content).GetAwaiter().GetResult()
        $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $stopwatch.Stop()

        [pscustomobject]@{
          StatusCode = [int]$response.StatusCode
          Success = $response.IsSuccessStatusCode
          DurationMs = $stopwatch.Elapsed.TotalMilliseconds
          Body = $body
        }
      }
      catch {
        $stopwatch.Stop()
        [pscustomobject]@{
          StatusCode = 0
          Success = $false
          DurationMs = $stopwatch.Elapsed.TotalMilliseconds
          Body = $_.Exception.Message
        }
      }
    })
  }

  $results = [System.Threading.Tasks.Task]::WhenAll($tasks).GetAwaiter().GetResult()
  foreach ($result in $results) {
    $durations.Add($result.DurationMs)
    if (-not $result.Success) {
      $failures++
    }
  }
}

$sorted = $durations | Sort-Object
$p95Index = [Math]::Min($sorted.Count - 1, [Math]::Floor($sorted.Count * 0.95))
$p95 = [Math]::Round($sorted[$p95Index], 2)
$avg = [Math]::Round((($durations | Measure-Object -Average).Average), 2)
$failureRate = if ($Requests -eq 0) { 0 } else { [Math]::Round(($failures / $Requests) * 100, 2) }

Write-Host "Requests: $Requests"
Write-Host "Concurrency: $Concurrency"
Write-Host "Average ms: $avg"
Write-Host "P95 ms: $p95"
Write-Host "Failure rate %: $failureRate"

if ($failureRate -gt $MaxFailureRatePercent -or $p95 -gt $MaxP95Ms) {
  throw "Load smoke thresholds failed. failureRate=$failureRate, p95=$p95"
}
