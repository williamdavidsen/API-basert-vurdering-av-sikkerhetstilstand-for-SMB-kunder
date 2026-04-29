param(
  [string]$ApiBaseUrl = 'http://localhost:1071',
  [string]$Domain = 'example.com',
  [int]$Requests = 24,
  [int]$Concurrency = 6,
  [int]$TimeoutSeconds = 30,
  [double]$MaxFailureRatePercent = 5,
  [int]$MaxP95Ms = 5000
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http

$apiBaseUrlNormalized = $ApiBaseUrl.TrimEnd('/') + '/'

function Invoke-LoadRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string] $BaseUrl,
    [Parameter(Mandatory = $true)]
    [string] $TargetDomain,
    [Parameter(Mandatory = $true)]
    [int] $RequestTimeoutSeconds
  )

  Add-Type -AssemblyName System.Net.Http

  $handler = [System.Net.Http.HttpClientHandler]::new()
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.BaseAddress = [Uri]$BaseUrl
  $client.Timeout = [TimeSpan]::FromSeconds($RequestTimeoutSeconds)

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $payload = @{ domain = $TargetDomain } | ConvertTo-Json
    $content = [System.Net.Http.StringContent]::new($payload, [System.Text.Encoding]::UTF8, 'application/json')
    $response = $client.PostAsync('api/assessment/check', $content).GetAwaiter().GetResult()
    $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $stopwatch.Stop()

    return [pscustomobject]@{
      StatusCode = [int]$response.StatusCode
      Success = $response.IsSuccessStatusCode
      DurationMs = $stopwatch.Elapsed.TotalMilliseconds
      Body = $body
    }
  }
  catch {
    $stopwatch.Stop()
    return [pscustomobject]@{
      StatusCode = 0
      Success = $false
      DurationMs = $stopwatch.Elapsed.TotalMilliseconds
      Body = $_.Exception.Message
    }
  }
  finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

function Invoke-LoadRequestBatch {
  param(
    [Parameter(Mandatory = $true)]
    [string] $BaseUrl,
    [Parameter(Mandatory = $true)]
    [string] $TargetDomain,
    [Parameter(Mandatory = $true)]
    [int] $TotalRequests,
    [Parameter(Mandatory = $true)]
    [int] $ThrottleLimit,
    [Parameter(Mandatory = $true)]
    [int] $RequestTimeoutSeconds
  )

  if ($PSVersionTable.PSVersion.Major -ge 7) {
    return 1..$TotalRequests | ForEach-Object -Parallel {
      Add-Type -AssemblyName System.Net.Http

      $handler = [System.Net.Http.HttpClientHandler]::new()
      $client = [System.Net.Http.HttpClient]::new($handler)
      $client.BaseAddress = [Uri]$using:BaseUrl
      $client.Timeout = [TimeSpan]::FromSeconds($using:RequestTimeoutSeconds)

      $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
      try {
        $payload = @{ domain = $using:TargetDomain } | ConvertTo-Json
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
      finally {
        $client.Dispose()
        $handler.Dispose()
      }
    } -ThrottleLimit $ThrottleLimit
  }

  $jobs = @()
  $results = New-Object System.Collections.Generic.List[object]
  $requestScript = ${function:Invoke-LoadRequest}.ToString()

  foreach ($requestNumber in 1..$TotalRequests) {
    while (($jobs | Where-Object { $_.State -eq 'Running' }).Count -ge $ThrottleLimit) {
      $completedJobs = $jobs | Where-Object { $_.State -ne 'Running' }
      foreach ($job in $completedJobs) {
        $results.Add((Receive-Job -Job $job -Wait))
        Remove-Job -Job $job
        $jobs = $jobs | Where-Object { $_.Id -ne $job.Id }
      }

      if (($jobs | Where-Object { $_.State -eq 'Running' }).Count -ge $ThrottleLimit) {
        Start-Sleep -Milliseconds 200
      }
    }

    $jobs += Start-Job -ScriptBlock {
      param($FunctionDefinition, $InnerBaseUrl, $InnerTargetDomain, $InnerTimeoutSeconds)
      Set-Item -Path Function:\Invoke-LoadRequest -Value $FunctionDefinition
      Invoke-LoadRequest -BaseUrl $InnerBaseUrl -TargetDomain $InnerTargetDomain -RequestTimeoutSeconds $InnerTimeoutSeconds
    } -ArgumentList $requestScript, $BaseUrl, $TargetDomain, $RequestTimeoutSeconds
  }

  foreach ($job in $jobs) {
    $results.Add((Receive-Job -Job $job -Wait))
    Remove-Job -Job $job
  }

  return $results
}

$results = Invoke-LoadRequestBatch `
  -BaseUrl $apiBaseUrlNormalized `
  -TargetDomain $Domain `
  -TotalRequests $Requests `
  -ThrottleLimit $Concurrency `
  -RequestTimeoutSeconds $TimeoutSeconds

$durations = New-Object System.Collections.Generic.List[double]
$failures = 0
foreach ($result in $results) {
  $durations.Add($result.DurationMs)
  if (-not $result.Success) {
    $failures++
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
