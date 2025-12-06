using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Tests.Integration.Auth;

public class AuthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task Login_And_RefreshToken_Works()
    {
        // Arrange
        var loginPayload = new
        {
            Email = "test@temp.com",
            Password = "test123"
        };

        // Act – login request
        var loginResponse = await _client.PostAsJsonAsync("/Auth/login", loginPayload);

        // Assert – should be 200 OK
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // Get response data
        var responseContent = await loginResponse.Content.ReadAsStringAsync();
        Console.WriteLine("Raw login response: " + responseContent);
        var loginData = JsonSerializer.Deserialize<LoginResponseDto>(responseContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        Assert.False(string.IsNullOrEmpty(loginData?.AccessToken));

        // Get refresh token from cookie
        var refreshTokenCookie = loginResponse.Headers
            .GetValues("Set-Cookie")
            .FirstOrDefault(c => c.StartsWith("refreshToken"));

        Assert.False(string.IsNullOrEmpty(refreshTokenCookie));

        // Act – send refresh request with cookie
        var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/Auth/refresh");
        refreshRequest.Headers.Add("Cookie", refreshTokenCookie!);

        var refreshResponse = await _client.SendAsync(refreshRequest);
        var refreshContent = await refreshResponse.Content.ReadAsStringAsync();

        // Assert – should return new token
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);
        var refreshData = JsonSerializer.Deserialize<LoginResponseDto>(refreshContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.False(string.IsNullOrEmpty(refreshData?.AccessToken));
    }

    private class LoginResponseDto
    {
        [JsonPropertyName("accessToken")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refreshToken")]
        public string RefreshToken { get; set; } = string.Empty;

        [JsonPropertyName("expiresIn")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("tokenType")]
        public string TokenType { get; set; } = string.Empty;
    }

}
