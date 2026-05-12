using System.Net;
using System.Text.Json;
using API.IntegrationTests.TestSupport;
using Xunit;

namespace API.IntegrationTests;

public sealed class ApiContractSmokeTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiContractSmokeTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AssessmentEndpoint_ExposesFieldsUsedByDashboard()
    {
        var response = await _client.GetAsync("/api/assessment/check/example.com");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;

        AssertString(root, "domain");
        AssertNumber(root, "overallScore");
        AssertString(root, "status");
        AssertString(root, "grade");
        AssertProperty(root, "weights", JsonValueKind.Object);
        AssertProperty(root, "modules", JsonValueKind.Object);
        AssertProperty(root, "alerts", JsonValueKind.Array);
    }

    private static void AssertProperty(JsonElement element, string propertyName, JsonValueKind kind)
    {
        Assert.True(element.TryGetProperty(propertyName, out var property), $"Expected property '{propertyName}'.");
        Assert.Equal(kind, property.ValueKind);
    }

    private static void AssertString(JsonElement element, string propertyName)
    {
        AssertProperty(element, propertyName, JsonValueKind.String);
    }

    private static void AssertNumber(JsonElement element, string propertyName)
    {
        AssertProperty(element, propertyName, JsonValueKind.Number);
    }
}
