namespace backend.Dtos;

public record PaymentDto(
    int PaymentId,
    int OrderId,
    string? Method,
    decimal Amount,
    string? Provider,
    string? Currency,
    string? PaymentStatus
);