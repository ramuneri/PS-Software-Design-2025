using System.Net;
using System.Net.Http.Json;
using backend.Dtos;
using Xunit;

namespace Backend.IntegrationTests;

public class DiscountsControllerTests : IClassFixture<TestApplicationFactory>
{
    private readonly HttpClient _client;

    public DiscountsControllerTests(TestApplicationFactory factory)
    {
        _client = factory.CreateAuthenticatedClient();
    }

    [Fact]
    public async Task CreateDiscount_ReturnsCreatedDiscount()
    {
        var dto = new CreateDiscountDto(
            ProductId: 1,
            ServiceId: null,
            Name: "Test Discount",
            Code: "DISCOUNT10",
            Scope: "product",
            Type: "percentage",
            Value: 10,
            StartsAt: DateTime.UtcNow.AddDays(-1),
            EndsAt: DateTime.UtcNow.AddDays(1)
        );

        var response = await _client.PostAsJsonAsync("/api/discounts", dto);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DiscountDto>();
        Assert.NotNull(result);
        Assert.Equal("Test Discount", result.Name);
        Assert.Equal(10, result.Value);
    }

    [Fact]
    public async Task GetAll_ReturnsDiscounts()
    {
        var response = await _client.GetAsync("/api/discounts");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<List<DiscountDto>>();
        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetById_ReturnsSingleDiscount()
    {
        // Create a discount first
        var dto = new CreateDiscountDto(
            ProductId: 1,
            ServiceId: null,
            Name: "ById Discount",
            Code: "BYID",
            Scope: "product",
            Type: "percentage",
            Value: 5,
            StartsAt: DateTime.UtcNow,
            EndsAt: DateTime.UtcNow.AddDays(2)
        );

        var createResponse = await _client.PostAsJsonAsync("/api/discounts", dto);
        var created = await createResponse.Content.ReadFromJsonAsync<DiscountDto>();

        var getResponse = await _client.GetAsync($"/api/discounts/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var fetched = await getResponse.Content.ReadFromJsonAsync<DiscountDto>();
        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched.Id);
        Assert.Equal("ById Discount", fetched.Name);
    }

    [Fact]
    public async Task UpdateDiscount_ChangesValue()
    {
        var dto = new CreateDiscountDto(
            ProductId: 1,
            ServiceId: null,
            Name: "ToUpdate",
            Code: "UPD",
            Scope: "product",
            Type: "percentage",
            Value: 15,
            StartsAt: DateTime.UtcNow,
            EndsAt: DateTime.UtcNow.AddDays(3)
        );

        var createResponse = await _client.PostAsJsonAsync("/api/discounts", dto);
        var created = await createResponse.Content.ReadFromJsonAsync<DiscountDto>();

        var updateDto = new UpdateDiscountDto(
            ProductId: null,
            ServiceId: null,
            Name: "Updated Name",
            Code: null,
            Scope: null,
            Type: null,
            Value: 25,
            StartsAt: null,
            EndsAt: null,
            IsActive: true
        );

        var patchResponse = await _client.PatchAsJsonAsync($"/api/discounts/{created!.Id}", updateDto);
        Assert.Equal(HttpStatusCode.OK, patchResponse.StatusCode);

        var updated = await patchResponse.Content.ReadFromJsonAsync<DiscountDto>();
        Assert.Equal("Updated Name", updated!.Name);
        Assert.Equal(25, updated.Value);
    }

    [Fact]
    public async Task DeleteAndRestore_WorksCorrectly()
    {
        var dto = new CreateDiscountDto(
            ProductId: 1,
            ServiceId: null,
            Name: "ToDelete",
            Code: "DEL",
            Scope: "product",
            Type: "fixed",
            Value: 5,
            StartsAt: DateTime.UtcNow,
            EndsAt: DateTime.UtcNow.AddDays(3)
        );

        var createResponse = await _client.PostAsJsonAsync("/api/discounts", dto);
        var created = await createResponse.Content.ReadFromJsonAsync<DiscountDto>();

        var deleteResponse = await _client.DeleteAsync($"/api/discounts/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var restoreResponse = await _client.PostAsync($"/api/discounts/{created.Id}/restore", null);
        Assert.Equal(HttpStatusCode.NoContent, restoreResponse.StatusCode);
    }
}
