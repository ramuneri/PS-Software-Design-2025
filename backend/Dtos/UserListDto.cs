namespace backend.Dtos;

public record UserListDto(
    string Id,
    string Email,
    string Name,
    string? PhoneNumber,
    string Role,
    bool IsActive,
    DateTime LastLoginAt
);
