namespace backend.Dtos;

public record ProductVariationDto(
    int Id,
    int ProductId,
    string Name,
    decimal PriceAdjustment
);

public record CreateProductVariationDto(
    string Name,
    decimal PriceAdjustment
);

public record UpdateProductVariationDto(
    string? Name,
    decimal? PriceAdjustment
);