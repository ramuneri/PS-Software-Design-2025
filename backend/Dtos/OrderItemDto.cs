namespace backend.Dtos;

public record OrderItemDto(
    int Id,
    int OrderId,
    int ProductId,
    int Quantity,
    decimal ItemTotal,
    string? ProductName = null,
    string? ServiceName = null,
    int? ProductVariationId = null,
    string? ProductVariationName = null
);