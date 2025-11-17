namespace backend.Dtos;

public record TaxCategoryDto(
    int Id,
    int MerchantId,
    string? Name,
    List<TaxRateDto>? Rates
);