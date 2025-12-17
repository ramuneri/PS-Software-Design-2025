using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Dtos;
using backend.Enums;
using FluentAssertions;
using Xunit;

namespace Backend.IntegrationTests;

public class InvitesControllerTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;

    public InvitesControllerTests(TestApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateInvite_AsOwner_ReturnsInviteLink()
    {
        // Arrange
        var client = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var dto = new CreateInviteDto(
            Email: "newemployee@example.com",
            Role: UserRoles.Employee
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/invites", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        result.Should().NotBeNull();
        result!.Email.Should().Be("newemployee@example.com");
        result.Role.Should().Be(UserRoles.Employee);
        result.InviteLink.Should().NotBeNullOrEmpty();
        result.InviteLink.Should().Contain("token=");
        result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task CreateInvite_AsSuperAdmin_ReturnsInviteLink()
    {
        // Arrange
        var client = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1, isSuperAdmin: true);
        var dto = new CreateInviteDto(
            Email: "newowner@example.com",
            Role: UserRoles.Owner
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/invites", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        result.Should().NotBeNull();
        result!.Role.Should().Be(UserRoles.Owner);
    }

    [Fact]
    public async Task CreateInvite_AsEmployee_ReturnsForbidden()
    {
        // Arrange
        var client = _factory.CreateAuthenticatedClient(role: UserRoles.Employee, merchantId: 1);
        var dto = new CreateInviteDto(
            Email: "newuser@example.com",
            Role: UserRoles.Employee
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/invites", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateInvite_AsOwner_WithOwnerRole_ReturnsForbidden()
    {
        // Arrange - Owner cannot invite other Owners, only SuperAdmin can
        var client = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1, isSuperAdmin: false);
        var dto = new CreateInviteDto(
            Email: "newowner@example.com",
            Role: UserRoles.Owner
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/invites", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateInvite_WithInvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var dto = new CreateInviteDto(
            Email: "not-an-email",
            Role: UserRoles.Employee
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/invites", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateInvite_WithInvalidRole_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var dto = new CreateInviteDto(
            Email: "user@example.com",
            Role: "InvalidRole"
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/invites", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateInvite_WithExistingUserEmail_ReturnsBadRequest()
    {
        // Arrange - Using email from seeded user
        var client = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var dto = new CreateInviteDto(
            Email: "test@example.com", // This user exists in test data
            Role: UserRoles.Employee
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/invites", dto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ValidateInvite_WithValidToken_ReturnsValidInvite()
    {
        // Arrange - Create an invite first
        var ownerClient = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var createDto = new CreateInviteDto(
            Email: "validate@example.com",
            Role: UserRoles.Employee
        );

        var createResponse = await ownerClient.PostAsJsonAsync("/api/invites", createDto);
        createResponse.EnsureSuccessStatusCode();
        var invite = await createResponse.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        
        // Extract token from invite link
        var token = invite!.InviteLink.Split("token=")[1].Split("&")[0];

        // Act - Validate without auth (anonymous endpoint)
        var client = _factory.CreateClient();
        var response = await client.GetAsync($"/api/invites/validate/{token}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ValidateInviteDto>();
        result.Should().NotBeNull();
        result!.IsValid.Should().BeTrue();
        result.Email.Should().Be("validate@example.com");
        result.Role.Should().Be(UserRoles.Employee);
        result.Message.Should().BeNull();
    }

    [Fact]
    public async Task ValidateInvite_WithInvalidToken_ReturnsInvalid()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/invites/validate/invalid-token-12345");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ValidateInviteDto>();
        result.Should().NotBeNull();
        result!.IsValid.Should().BeFalse();
        result.Message.Should().Contain("Invalid invite token");
    }

    [Fact]
    public async Task AcceptInvite_WithValidData_CreatesUser()
    {
        // Arrange - Create an invite first
        var ownerClient = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var createDto = new CreateInviteDto(
            Email: "accept@example.com",
            Role: UserRoles.Employee
        );

        var createResponse = await ownerClient.PostAsJsonAsync("/api/invites", createDto);
        createResponse.EnsureSuccessStatusCode();
        var invite = await createResponse.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        
        // Extract token from invite link
        var token = invite!.InviteLink.Split("token=")[1].Split("&")[0];

        var acceptDto = new AcceptInviteDto(
            Token: token,
            Email: "accept@example.com",
            Password: "SecurePass123!",
            Name: "John",
            Surname: "Doe"
        );

        // Act - Accept without auth (anonymous endpoint)
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/invites/accept", acceptDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<UserDto>();
        result.Should().NotBeNull();
        result!.Email.Should().Be("accept@example.com");
        result.Role.Should().Be(UserRoles.Employee);
        result.Name.Should().Be("John");
        result.Surname.Should().Be("Doe");
        result.MerchantId.Should().Be(1);
    }

    [Fact]
    public async Task AcceptInvite_WithWrongEmail_ReturnsBadRequest()
    {
        // Arrange - Create an invite first
        var ownerClient = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var createDto = new CreateInviteDto(
            Email: "accept2@example.com",
            Role: UserRoles.Employee
        );

        var createResponse = await ownerClient.PostAsJsonAsync("/api/invites", createDto);
        createResponse.EnsureSuccessStatusCode();
        var invite = await createResponse.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        
        var token = invite!.InviteLink.Split("token=")[1].Split("&")[0];

        var acceptDto = new AcceptInviteDto(
            Token: token,
            Email: "wrong@example.com", // Wrong email
            Password: "SecurePass123!",
            Name: "John",
            Surname: "Doe"
        );

        // Act
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/invites/accept", acceptDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AcceptInvite_WithInvalidPassword_ReturnsBadRequest()
    {
        // Arrange - Create an invite first
        var ownerClient = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var createDto = new CreateInviteDto(
            Email: "accept3@example.com",
            Role: UserRoles.Employee
        );

        var createResponse = await ownerClient.PostAsJsonAsync("/api/invites", createDto);
        createResponse.EnsureSuccessStatusCode();
        var invite = await createResponse.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        
        var token = invite!.InviteLink.Split("token=")[1].Split("&")[0];

        var acceptDto = new AcceptInviteDto(
            Token: token,
            Email: "accept3@example.com",
            Password: "123", // Too short
            Name: "John",
            Surname: "Doe"
        );

        // Act
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/invites/accept", acceptDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AcceptInvite_Twice_ReturnsBadRequest()
    {
        // Arrange - Create and accept an invite
        var ownerClient = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var createDto = new CreateInviteDto(
            Email: "accept4@example.com",
            Role: UserRoles.Employee
        );

        var createResponse = await ownerClient.PostAsJsonAsync("/api/invites", createDto);
        createResponse.EnsureSuccessStatusCode();
        var invite = await createResponse.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        
        var token = invite!.InviteLink.Split("token=")[1].Split("&")[0];

        var acceptDto = new AcceptInviteDto(
            Token: token,
            Email: "accept4@example.com",
            Password: "SecurePass123!",
            Name: "John",
            Surname: "Doe"
        );

        var client = _factory.CreateClient();
        
        // First accept should succeed
        var firstResponse = await client.PostAsJsonAsync("/api/invites/accept", acceptDto);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Act - Try to accept again
        var secondResponse = await client.PostAsJsonAsync("/api/invites/accept", acceptDto);

        // Assert
        secondResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ValidateInvite_AfterAccept_ReturnsInvalid()
    {
        // Arrange - Create and accept an invite
        var ownerClient = _factory.CreateAuthenticatedClient(role: UserRoles.Owner, merchantId: 1);
        var createDto = new CreateInviteDto(
            Email: "accept5@example.com",
            Role: UserRoles.Employee
        );

        var createResponse = await ownerClient.PostAsJsonAsync("/api/invites", createDto);
        createResponse.EnsureSuccessStatusCode();
        var invite = await createResponse.Content.ReadFromJsonAsync<CreateInviteResponseDto>();
        
        var token = invite!.InviteLink.Split("token=")[1].Split("&")[0];

        var acceptDto = new AcceptInviteDto(
            Token: token,
            Email: "accept5@example.com",
            Password: "SecurePass123!",
            Name: "John",
            Surname: "Doe"
        );

        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/invites/accept", acceptDto);

        // Act - Validate after acceptance
        var validateResponse = await client.GetAsync($"/api/invites/validate/{token}");

        // Assert
        validateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await validateResponse.Content.ReadFromJsonAsync<ValidateInviteDto>();
        result.Should().NotBeNull();
        result!.IsValid.Should().BeFalse();
        result.Message.Should().Contain("already been accepted");
    }
}

// DTOs for deserialization
public record CreateInviteResponseDto(
    int Id,
    string Email,
    string Role,
    string InviteLink,
    DateTime ExpiresAt
);

public record ValidateInviteDto(
    string Email,
    string Role,
    bool IsValid,
    string? Message
);

public record UserDto(
    string Id,
    int MerchantId,
    string Email,
    string Name,
    string Surname,
    string PhoneNumber,
    string Role,
    bool IsSuperAdmin,
    bool IsActive,
    DateTime? LastLoginAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

