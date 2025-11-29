namespace backend.Dtos;

public record OrderItemDto(
    int Id,
    int OrderId,
    int ProductId,
    int Quantity,
    decimal Price
);