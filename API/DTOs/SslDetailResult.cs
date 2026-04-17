namespace SecurityAssessmentAPI.DTOs
{
    public class SslDetailResult
    {
        public string Domain { get; set; } = string.Empty;
        public int OverallScore { get; set; }
        public int MaxScore { get; set; } = 30;
        public string Status { get; set; } = "UNKNOWN";
        public string DataSource { get; set; } = "UNKNOWN";
        public string DataSourceStatus { get; set; } = string.Empty;
        public SslCriteria Criteria { get; set; } = new();
        public List<SslAlert> Alerts { get; set; } = new();
        public List<SslEndpointDetail> Endpoints { get; set; } = new();
        public SslCertificateDetail Certificate { get; set; } = new();
        public List<string> SupportedTlsVersions { get; set; } = new();
        public List<string> NotableCipherSuites { get; set; } = new();
    }

    public class SslEndpointDetail
    {
        public string IpAddress { get; set; } = string.Empty;
        public string ServerName { get; set; } = string.Empty;
        public string Grade { get; set; } = "UNAVAILABLE";
    }

    public class SslCertificateDetail
    {
        public string Subject { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string FingerprintSha256 { get; set; } = string.Empty;
        public string SignatureAlgorithm { get; set; } = string.Empty;
        public string Key { get; set; } = string.Empty;
        public DateTimeOffset? ValidFrom { get; set; }
        public DateTimeOffset? ValidUntil { get; set; }
        public int? DaysRemaining { get; set; }
        public List<string> CommonNames { get; set; } = new();
        public List<string> AltNames { get; set; } = new();
    }
}
