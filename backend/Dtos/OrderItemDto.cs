namespace backend.Dtos;

public record OrderItemDto(
    int Id,
    int OrderId,
    int? ProductId,
    int? ServiceId,
    int? ReservationId,
    int Quantity,
    string? ProductName,
    string? ServiceName,
    decimal? Price
);