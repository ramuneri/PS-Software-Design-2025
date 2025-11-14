namespace backend.Dtos;

public record RefundDto(
    int RefundId,
    int PaymentId,
    decimal Amount,
    string? Reason,
    DateTime CreatedAt
);