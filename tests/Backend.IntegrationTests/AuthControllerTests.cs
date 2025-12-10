using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Backend.IntegrationTests;

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

        // Act: login request
        var loginResponse = await _client.PostAsJsonAsync("/Auth/login", loginPayload);

        // Assert: should be 200 OK
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // Get response data
        var responseContent = await loginResponse.Content.ReadAsStringAsync();
        var loginData = JsonSerializer.Deserialize<LoginResponseDto>(
            responseContent,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.False(string.IsNullOrEmpty(loginData?.AccessToken));
        Assert.False(string.IsNullOrEmpty(loginData.RefreshToken));
        Assert.True(loginData.ExpiresIn > 0);
        Assert.Equal("Bearer", loginData.TokenType);

        // Get refresh token from cookie
        var refreshTokenCookie = loginResponse.Headers
            .GetValues("Set-Cookie")
            .FirstOrDefault(c => c.StartsWith("refreshToken"));

        Assert.False(string.IsNullOrEmpty(refreshTokenCookie));

        // Act: Send refresh request with cookie
        var refreshRequest = new HttpRequestMessage(HttpMethod.Post, "/Auth/refresh");
        refreshRequest.Headers.Add("Cookie", refreshTokenCookie!);

        var refreshResponse = await _client.SendAsync(refreshRequest);
        var refreshContent = await refreshResponse.Content.ReadAsStringAsync();

        // Assert: Should return new token
        Assert.Equal(HttpStatusCode.OK, refreshResponse.StatusCode);
        var refreshData = JsonSerializer.Deserialize<LoginResponseDto>(
            refreshContent,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.False(string.IsNullOrEmpty(refreshData?.AccessToken));
    }

    [Fact]
    public async Task Login_WithInvalidEmailFormat_ReturnsBadRequest()
    {
        var payload = new
        {
            Email = "not-an-email",
            Password = "whatever"
        };

        var response = await _client.PostAsJsonAsync("/Auth/login", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var payload = new
        {
            Email = "test@temp.com",
            Password = "WRONG"
        };

        var response = await _client.PostAsJsonAsync("/Auth/login", payload);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithoutCookie_ReturnsUnauthorized()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/Auth/refresh");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_WithoutAuthenticatedUser_DeletesCookie_AndReturnsNoContent()
    {
        // Login to ensure we have a refresh cookie
        var loginPayload = new
        {
            Email = "test@temp.com",
            Password = "test123"
        };

        var loginResponse = await _client.PostAsJsonAsync("/Auth/login", loginPayload);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var refreshTokenCookie = loginResponse.Headers
            .GetValues("Set-Cookie")
            .FirstOrDefault(c => c.StartsWith("refreshToken"));

        Assert.False(string.IsNullOrEmpty(refreshTokenCookie));

        // Call logout without any Authorization header
        var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/Auth/logout")
        {
            Content = JsonContent.Create(new { allSessions = false })
        };

        // Attach the cookie so the controller can delete it
        logoutRequest.Headers.Add("Cookie", refreshTokenCookie!);

        var logoutResponse = await _client.SendAsync(logoutRequest);

        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        // Optionally assert that Set-Cookie deletes the cookie
        var setCookieHeader = logoutResponse.Headers.TryGetValues("Set-Cookie", out var cookies)
            ? cookies.FirstOrDefault(c => c.StartsWith("refreshToken"))
            : null;

        if (setCookieHeader != null)
        {
            Assert.Contains("refreshToken=", setCookieHeader);
        }
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
