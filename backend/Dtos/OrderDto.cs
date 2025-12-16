
using backend.Enums;

namespace backend.Dtos;

public record OrderDto(
    int Id,
    string? EmployeeId,
    string? CustomerIdentifier,
    List<OrderItemDto> Items,
    List<PaymentDto>? Payments,
    decimal SubTotal,
    decimal Tax,
    decimal TotalAmount,
    string? Note,
    Status Status,
    DateTime CreatedAt,
    DateTime? ClosedAt,
    DateTime? CancelledAt
);