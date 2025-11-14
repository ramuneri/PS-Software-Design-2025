namespace backend.Dtos;

public record ServiceDto(
    int ServiceId,
    int MerchantId,
    int? TaxCategoryId,
    string? Name,
    decimal? DefaultPrice,
    int? DurationMinutes,
    bool IsActive
);