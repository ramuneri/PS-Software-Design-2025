namespace backend.Dtos;

public record TaxRateDto(
    int Id,
    int TaxCategoryId,
    decimal RatePercent,
    DateTime EffectiveFrom,
    DateTime? EffectiveTo,
    bool IsActive = true
);
