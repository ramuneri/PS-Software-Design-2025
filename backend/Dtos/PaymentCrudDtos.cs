namespace backend.Dtos;

public record CreatePaymentDto(
    int OrderId,
    string Method,
    decimal Amount,
    string Currency,
    string? Provider = null,
    string? PaymentStatus = null
);

public record UpdatePaymentDto(
    int? OrderId = null,
    string? Method = null,
    decimal? Amount = null,
    string? Currency = null,
    string? Provider = null,
    string? PaymentStatus = null
);
