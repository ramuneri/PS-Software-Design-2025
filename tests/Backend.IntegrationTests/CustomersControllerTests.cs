using System.Net;
using System.Net.Http.Json;
using backend.Dtos;
using FluentAssertions;
using Xunit;

namespace Backend.IntegrationTests;

public class CustomersControllerTests : IClassFixture<TestApplicationFactory>
{
    private readonly HttpClient _client;

    public CustomersControllerTests(TestApplicationFactory factory)
    {
        _client = factory.CreateAuthenticatedClient();
    }

    private HttpRequestMessage WithMerchant(HttpRequestMessage request, int merchantId = 1)
    {
        request.Headers.Add("X-Merchant-Id", merchantId.ToString());
        return request;
    }

    [Fact]
    public async Task List_AllowsSearchAndActiveToggle()
    {
        // arrange: create a customer
        var create = new CustomerCreateDto("Alice", "Tester", "alice@test.com", "123");
        var createReq = WithMerchant(new HttpRequestMessage(HttpMethod.Post, "/api/customers")
        {
            Content = JsonContent.Create(create)
        });
        var createResp = await _client.SendAsync(createReq);
        createResp.StatusCode.Should().Be(HttpStatusCode.Created);

        // act: search by partial name
        var listReq = WithMerchant(new HttpRequestMessage(HttpMethod.Get, "/api/customers?q=ali"));
        var listResp = await _client.SendAsync(listReq);
        listResp.EnsureSuccessStatusCode();
        var list = await listResp.Content.ReadFromJsonAsync<DataResponse<List<CustomerDto>>>();

        // assert
        list.Should().NotBeNull();
        list!.Data.Should().Contain(c => (c.Name ?? string.Empty).Contains("Alice"));
    }

    [Fact]
    public async Task Crud_FullLifecycle_Works()
    {
        // create
        var createDto = new CustomerCreateDto("Bob", "Builder", "bob@test.com", "555-1234");
        var createReq = WithMerchant(new HttpRequestMessage(HttpMethod.Post, "/api/customers")
        {
            Content = JsonContent.Create(createDto)
        });
        var createResp = await _client.SendAsync(createReq);
        createResp.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResp.Content.ReadFromJsonAsync<DataResponse<CustomerDto>>();
        created?.Data.Should().NotBeNull();
        var id = created!.Data.Id;

        // get by id
        var getResp = await _client.GetAsync($"/api/customers/{id}");
        getResp.EnsureSuccessStatusCode();
        var fetched = await getResp.Content.ReadFromJsonAsync<DataResponse<CustomerDto>>();
        fetched?.Data.Email.Should().Be(createDto.Email);

        // update
        var updateDto = new CustomerUpdateDto(Name: "Bobbie", Surname: "Builder", Email: "bobbie@test.com", Phone: "555-5678", IsActive: null);
        var updateResp = await _client.PatchAsJsonAsync($"/api/customers/{id}", updateDto);
        updateResp.EnsureSuccessStatusCode();
        var updated = await updateResp.Content.ReadFromJsonAsync<DataResponse<CustomerDto>>();
        updated?.Data.Name.Should().Be("Bobbie");
        updated?.Data.Email.Should().Be("bobbie@test.com");

        // delete (soft)
        var deleteResp = await _client.DeleteAsync($"/api/customers/{id}");
        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // verify inactive via list with includeInactive
        var listReq = WithMerchant(new HttpRequestMessage(HttpMethod.Get, "/api/customers?includeInactive=true"));
        var listResp = await _client.SendAsync(listReq);
        listResp.EnsureSuccessStatusCode();
        var list = await listResp.Content.ReadFromJsonAsync<DataResponse<List<CustomerDto>>>();
        list!.Data.Should().Contain(c => c.Id == id && c.IsActive == false);

        // restore
        var restoreResp = await _client.PostAsync($"/api/customers/{id}/restore", content: null);
        restoreResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // verify active again
        var getRespAfterRestore = await _client.GetAsync($"/api/customers/{id}");
        getRespAfterRestore.EnsureSuccessStatusCode();
        var restored = await getRespAfterRestore.Content.ReadFromJsonAsync<DataResponse<CustomerDto>>();
        restored!.Data.IsActive.Should().BeTrue();
    }
}
