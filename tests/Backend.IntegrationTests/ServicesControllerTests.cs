using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Dtos;
using backend.Data.Models;
using FluentAssertions;

namespace Backend.IntegrationTests;

public class ServicesControllerTests : IClassFixture<TestApplicationFactory>
{
    private readonly HttpClient _client;

    public ServicesControllerTests(TestApplicationFactory factory)
    {
        _client = factory.CreateAuthenticatedClient();
    }

    [Fact]
    public async Task GetAll_ReturnsSuccess()
    {
        var response = await _client.GetAsync("/api/services");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("data").EnumerateArray().Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetById_Existing_ReturnsService()
    {
        var response = await _client.GetAsync("/api/services/1");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("data").GetProperty("serviceId").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task Create_ReturnsCreated()
    {
        var newService = new CreateServiceRequest
        {
            Name = "New Service",
            Description = "Test description",
            DefaultPrice = 99.99m,
            DurationMinutes = 30,
            IsActive = true
        };

        var response = await _client.PostAsJsonAsync("/api/services", newService);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("data").GetProperty("name").GetString().Should().Be("New Service");
    }

    [Fact]
    public async Task Update_ExistingService_ReturnsUpdated()
    {
        var update = new UpdateServiceRequest
        {
            Name = "Updated Service",
            DefaultPrice = 199.99m
        };

        var response = await _client.PatchAsJsonAsync("/api/services/1", update);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        json.GetProperty("data").GetProperty("name").GetString().Should().Be("Updated Service");
    }

    [Fact]
    public async Task SoftDelete_ExistingService_ReturnsNoContent()
    {
        var response = await _client.DeleteAsync("/api/services/1");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Restore_DeletedService_ReturnsNoContent()
    {
        // First soft delete
        await _client.DeleteAsync("/api/services/1");

        // Then restore
        var response = await _client.PostAsync("/api/services/1/restore", null);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
