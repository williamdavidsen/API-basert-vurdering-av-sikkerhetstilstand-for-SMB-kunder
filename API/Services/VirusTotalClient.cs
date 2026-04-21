using System.Net;
using System.Text.Json;

namespace SecurityAssessmentAPI.Services
{
    public class VirusTotalDomainReport
    {
        public string Domain { get; set; } = string.Empty;
        public int Reputation { get; set; }
        public int MaliciousDetections { get; set; }
        public int SuspiciousDetections { get; set; }
        public int HarmlessDetections { get; set; }
        public int UndetectedDetections { get; set; }
        public int CommunityMaliciousVotes { get; set; }
        public int CommunityHarmlessVotes { get; set; }
        public DateTimeOffset? LastAnalysisDate { get; set; }
        public string Permalink { get; set; } = string.Empty;
    }

    public interface IVirusTotalClient
    {
        Task<VirusTotalLookupResult> GetDomainReportAsync(string domain, CancellationToken cancellationToken = default);
    }

    public class VirusTotalLookupResult
    {
        public VirusTotalDomainReport? Report { get; set; }
        public string FailureReason { get; set; } = string.Empty;
        public int? ProviderStatusCode { get; set; }
    }

    public class VirusTotalClient : IVirusTotalClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<VirusTotalClient> _logger;

        public VirusTotalClient(HttpClient httpClient, IConfiguration configuration, ILogger<VirusTotalClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<VirusTotalLookupResult> GetDomainReportAsync(string domain, CancellationToken cancellationToken = default)
        {
            var apiKey = ResolveApiKey();
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("VirusTotal API key is not configured. Set VirusTotal:ApiKey or VirusTotal__ApiKey in the host environment.");
                return new VirusTotalLookupResult
                {
                    FailureReason = "VirusTotal API key is missing in the backend environment."
                };
            }

            var url = $"https://www.virustotal.com/api/v3/domains/{Uri.EscapeDataString(domain)}";

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("x-apikey", apiKey);

                _logger.LogInformation("Calling VirusTotal API for domain report: {Domain}", domain);

                using var response = await _httpClient.SendAsync(request, cancellationToken);
                var json = await response.Content.ReadAsStringAsync(cancellationToken);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    _logger.LogInformation("VirusTotal did not return a report for domain: {Domain}", domain);
                    return new VirusTotalLookupResult
                    {
                        Report = new VirusTotalDomainReport
                        {
                            Domain = domain,
                            Permalink = $"https://www.virustotal.com/gui/domain/{domain}"
                        }
                    };
                }

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("VirusTotal returned non-success status: Domain={Domain}, Status={StatusCode}, Body={Body}",
                        domain, (int)response.StatusCode, json);
                    return new VirusTotalLookupResult
                    {
                        FailureReason = DescribeFailureReason(response.StatusCode),
                        ProviderStatusCode = (int)response.StatusCode
                    };
                }

                return new VirusTotalLookupResult
                {
                    Report = ParseDomainReport(json)
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "VirusTotal request failed: {Domain}", domain);
                return new VirusTotalLookupResult
                {
                    FailureReason = $"VirusTotal request failed before a response was returned: {ex.GetType().Name}."
                };
            }
        }

        private static string DescribeFailureReason(HttpStatusCode statusCode)
        {
            return statusCode switch
            {
                HttpStatusCode.Unauthorized => "VirusTotal rejected the API key (401 Unauthorized).",
                HttpStatusCode.Forbidden => "VirusTotal blocked the request (403 Forbidden). Check plan or access restrictions.",
                (HttpStatusCode)429 => "VirusTotal rate limit or quota was exceeded (429 Too Many Requests).",
                HttpStatusCode.BadRequest => "VirusTotal rejected the request format (400 Bad Request).",
                HttpStatusCode.NotFound => "VirusTotal does not currently have a report for this domain.",
                _ => $"VirusTotal returned HTTP {(int)statusCode}."
            };
        }

        private string? ResolveApiKey()
        {
            var configuredKey = _configuration["VirusTotal:ApiKey"];
            if (!string.IsNullOrWhiteSpace(configuredKey))
            {
                return configuredKey;
            }

            var environmentKey = Environment.GetEnvironmentVariable("VirusTotal__ApiKey");
            if (!string.IsNullOrWhiteSpace(environmentKey))
            {
                return environmentKey;
            }

            return Environment.GetEnvironmentVariable("VirusTotal:ApiKey");
        }

        private static VirusTotalDomainReport ParseDomainReport(string json)
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            var data = root.GetProperty("data");
            var attributes = data.GetProperty("attributes");

            var stats = attributes.TryGetProperty("last_analysis_stats", out var statsElement) ? statsElement : default;
            var votes = attributes.TryGetProperty("total_votes", out var votesElement) ? votesElement : default;

            return new VirusTotalDomainReport
            {
                Domain = GetString(data, "id") ?? string.Empty,
                Reputation = GetInt32(attributes, "reputation"),
                MaliciousDetections = GetInt32(stats, "malicious"),
                SuspiciousDetections = GetInt32(stats, "suspicious"),
                HarmlessDetections = GetInt32(stats, "harmless"),
                UndetectedDetections = GetInt32(stats, "undetected"),
                CommunityMaliciousVotes = GetInt32(votes, "malicious"),
                CommunityHarmlessVotes = GetInt32(votes, "harmless"),
                LastAnalysisDate = GetUnixDateTimeOffset(attributes, "last_analysis_date"),
                Permalink = $"https://www.virustotal.com/gui/domain/{GetString(data, "id")}"
            };
        }

        private static string? GetString(JsonElement element, string propertyName)
        {
            if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(propertyName, out var property))
            {
                return null;
            }

            return property.ValueKind == JsonValueKind.String ? property.GetString() : property.ToString();
        }

        private static int GetInt32(JsonElement element, string propertyName)
        {
            if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(propertyName, out var property))
            {
                return 0;
            }

            if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out var numberValue))
            {
                return numberValue;
            }

            return property.ValueKind == JsonValueKind.String && int.TryParse(property.GetString(), out var stringValue)
                ? stringValue
                : 0;
        }

        private static DateTimeOffset? GetUnixDateTimeOffset(JsonElement element, string propertyName)
        {
            var unixValue = GetInt32(element, propertyName);
            return unixValue > 0 ? DateTimeOffset.FromUnixTimeSeconds(unixValue) : null;
        }
    }
}
