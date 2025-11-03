namespace backend.Dtos;

public record UserDto(
    string Id,
    string MerchantId,
    string Email,
    string Name,
    string Surname,
    string PhoneNumber,
    string Role,
    bool IsSuperAdmin,
    bool IsActive,
    DateTime LastLoginAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
    );