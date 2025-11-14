namespace backend.Dtos;

public record GiftcardDto(
    int GiftcardId,
    int MerchantId,
    string? Code,
    decimal InitialBalance,
    decimal Balance,
    DateTime? IssuedDate,
    DateTime? ExpirationDate
);