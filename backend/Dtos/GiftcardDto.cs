namespace backend.Dtos;

public record GiftcardDto(
    int Id,
    int MerchantId,
    string Code,
    decimal InitialBalance,
    decimal Balance,
    DateTime IssuedAt,
    DateTime? ExpiresAt,
    bool IsActive,
    DateTime? DeletedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record GiftcardCreateDto(
    decimal InitialBalance,
    string? Code
);

public record GiftcardUpdateDto(
    bool? IsActive
);