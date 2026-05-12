using System.Net;
using System.Net.Http.Json;
using API.IntegrationTests.TestSupport;
using SecurityAssessmentAPI.DTOs;
using Xunit;

namespace API.IntegrationTests;

public sealed class AssessmentApiSmokeTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AssessmentApiSmokeTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAssessmentCheck_WithValidDomain_ReturnsDashboardPayload()
    {
        var response = await _client.GetAsync("/api/assessment/check/example.com");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<AssessmentCheckResult>();

        Assert.NotNull(body);
        Assert.Equal("example.com", body.Domain);
        Assert.Equal("PARTIAL", body.Status);
        Assert.Equal("B", body.Grade);
        Assert.Equal(80, body.OverallScore);
    }

    [Fact]
    public async Task PostAssessmentCheck_WithUrlInput_NormalizesDomain()
    {
        var response = await _client.PostAsJsonAsync("/api/assessment/check", new AssessmentCheckRequest
        {
            Domain = "https://example.com/path"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<AssessmentCheckResult>();

        Assert.NotNull(body);
        Assert.Equal("example.com", body.Domain);
    }
}
