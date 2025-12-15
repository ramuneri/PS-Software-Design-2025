using System.Net;
using System.Net.Http.Json;
using backend.Dtos;
using FluentAssertions;
using Xunit;

namespace Backend.IntegrationTests;

public class ProductsControllerTests : IClassFixture<TestApplicationFactory>
{
    private readonly HttpClient _client;

    public ProductsControllerTests(TestApplicationFactory factory)
    {
        _client = factory.CreateAuthenticatedClient();
    }

    [Fact]
    public async Task GetAll_ReturnsList()
    {
        var response = await _client.GetAsync("/api/products");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<DataResponse<List<ProductDto>>>();
        payload?.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task Search_WithQuery_ReturnsMatchingProducts()
    {
        var response = await _client.GetAsync("/api/products/search?q=test");
        response.EnsureSuccessStatusCode();

        var results = await response.Content.ReadFromJsonAsync<List<ProductDto>>();
        results.Should().NotBeNull();
    }

    [Fact]
    public async Task GetById_Existing_ReturnsProduct()
    {
        // Get all products
        var listResponse = await _client.GetAsync("/api/products");
        listResponse.EnsureSuccessStatusCode();

        var payload = await listResponse.Content.ReadFromJsonAsync<DataResponse<List<ProductDto>>>();
        Assert.NotNull(payload?.Data);
        Assert.NotEmpty(payload.Data);

        var product = payload.Data.First();

        // Act
        var response = await _client.GetAsync($"/api/products/{product.Id}");
        response.EnsureSuccessStatusCode();

        var fetched = await response.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(fetched);
        Assert.Equal(product.Id, fetched.Id);
        Assert.Equal(product.Name, fetched.Name);
    }


    [Fact]
    public async Task GetById_NotFound_Returns404()
    {
        var response = await _client.GetAsync("/api/products/99999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_Valid_ReturnsCreatedProduct()
    {
        var dto = new CreateProductDto(
            Name: "New Product",
            Price: 15.99m,
            Category: "Electronics",
            TaxCategoryId: null,
            IsActive: true
        );

        var response = await _client.PostAsJsonAsync("/api/products", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<ProductDto>();
        created.Should().NotBeNull();
        created!.Name.Should().Be(dto.Name);
    }

    [Fact]
    public async Task Update_ExistingProduct_ReturnsUpdated()
    {
        var dto = new UpdateProductDto(
            Name: "Updated Name",
            Price: 19.99m,
            Category: "Updated Category",
            TaxCategoryId: null,
            IsActive: false
        );

        var response = await _client.PatchAsJsonAsync("/api/products/1", dto);
        response.EnsureSuccessStatusCode();

        var updated = await response.Content.ReadFromJsonAsync<ProductDto>();
        updated!.Name.Should().Be(dto.Name);
        updated.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Delete_ExistingProduct_ReturnsNoContent()
    {
        var response = await _client.DeleteAsync("/api/products/1");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Delete_NonexistentProduct_ReturnsNotFound()
    {
        var response = await _client.DeleteAsync("/api/products/99999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}

public record DataResponse<T>(T Data);
