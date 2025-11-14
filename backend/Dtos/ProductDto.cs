namespace backend.Dtos;

public record ProductDto(
    int ProductId,
    int MerchantId,
    int? TaxCategoryId,
    string? Name,
    decimal? Price,
    string? Category,
    bool IsActive
);