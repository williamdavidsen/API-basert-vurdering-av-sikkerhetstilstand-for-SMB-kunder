using System.Net;
using System.Text.Json;
using API.IntegrationTests.TestSupport;
using Xunit;

namespace API.IntegrationTests;

public sealed class PlatformSecurityAndDiagnosticsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PlatformSecurityAndDiagnosticsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RootRoute_ReturnsHealthMessageAndSwaggerLink()
    {
        var response = await _client.GetAsync("/");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("SecurityAssessment API is running", json, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("/swagger", json, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData($"/api/assessment/check/{CustomWebApplicationFactory.ThrowDomain}", "Assessment check could not be performed")]
    [InlineData($"/api/headers/check/{CustomWebApplicationFactory.ThrowDomain}", "Headers check could not be performed")]
    [InlineData($"/api/email/check/{CustomWebApplicationFactory.ThrowDomain}", "Email security check could not be performed")]
    [InlineData($"/api/reputation/check/{CustomWebApplicationFactory.ThrowDomain}", "Reputation check could not be performed")]
    [InlineData($"/api/ssl/check/{CustomWebApplicationFactory.ThrowDomain}", "SSL check could not be performed")]
    [InlineData($"/api/ssl/details/{CustomWebApplicationFactory.ThrowDomain}", "SSL details could not be performed")]
    [InlineData($"/api/pqc/check/{CustomWebApplicationFactory.ThrowDomain}", "PQC check could not be performed")]
    public async Task ErrorResponses_DoNotLeakInternalExceptionMessages(string url, string expectedMessage)
    {
        var response = await _client.GetAsync(url);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;

        Assert.Equal(expectedMessage, root.GetProperty("message").GetString());
        Assert.False(root.TryGetProperty("error", out _));
        Assert.DoesNotContain("Simulated service failure", root.ToString(), StringComparison.OrdinalIgnoreCase);
    }
}
