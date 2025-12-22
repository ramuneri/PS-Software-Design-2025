namespace backend.Dtos;

public record MerchantCreateDto(
    string Name,
    string? BusinessType,
    string? Country,
    string? Address,
    string? City,
    string? Phone,
    string? Email,
    string? PaymentProvider,
    string? PaymentConfig,
    string? OwnerId
);
