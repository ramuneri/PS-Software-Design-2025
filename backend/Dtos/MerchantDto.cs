namespace backend.Dtos;

public record MerchantDto(
    int MerchantId,
    string? OwnerId,
    string Name,
    string? BusinessType,
    string Country,
    string? Address,
    string? City,
    string? Phone,
    string Email
);