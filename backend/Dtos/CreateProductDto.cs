namespace backend.Dtos;

public record CreateProductDto(
    string Name,
    decimal? Price,
    string? Category,
    int? TaxCategoryId,
    bool? IsActive
);
