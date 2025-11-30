    namespace backend.Dtos;
    
    public record UpdateProductDto(
        string? Name,
        decimal? Price,
        string? Category,
        int? TaxCategoryId,
        bool? IsActive
    );