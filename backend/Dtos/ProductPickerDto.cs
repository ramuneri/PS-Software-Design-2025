namespace backend.Dtos.Products;

public record ProductPickerDto(
    int ProductId,
    string Name,
    decimal? Price
);
