
using backend.Enums;

namespace backend.Dtos;

public record OrderDto(
    int Id,
    string EmployeeId,
    string CustomerId,
    List<OrderItemDto> Items,
    List<PaymentDto>? Payments,
    decimal SubTotal,
    decimal Tax,
    decimal TotalAmount,
    string Note,
    Status Status,
    DateTime OpenedAt,
    DateTime? ClosedAt,
    DateTime? CancelledAt
);