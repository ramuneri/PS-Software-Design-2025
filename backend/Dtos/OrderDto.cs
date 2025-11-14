namespace backend.Dtos;

public record OrderDto(
    int OrderId,
    string? EmployeeId,
    string? CustomerId,
    int? BusinessPricingPolicyId,
    DateTime? OpenedAt,
    DateTime? ClosedAt,
    DateTime? CancelledAt,
    List<OrderItemDto> Items,
    List<PaymentDto> Payments,
    decimal TotalAmount
);