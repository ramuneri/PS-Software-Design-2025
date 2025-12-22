
using backend.Enums;
using System.Text.Json.Serialization;

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
    DateTime? CancelledAt,
    List<OrderTaxBreakdownDto>? TaxBreakdown,
    decimal DiscountAmount = 0,
    decimal ServiceChargeAmount = 0,
    decimal Tip = 0
)
{
    // Alias for frontend expectations
    [JsonPropertyName("openedAt")]
    public DateTime OpenedAt => CreatedAt;
}
