namespace backend.Dtos;

public record RefundRequestDto(
    decimal Amount,
    string? Reason
);

public record RefundDto(
    int RefundId,
    int OrderId,
    decimal Amount,
    string? Reason,
    bool IsPartial,
    DateTime CreatedAt
);

public record RefundResponseDto(
    int RefundId,
    int OrderId,
    decimal Amount,
    string? Reason,
    bool IsPartial,
    DateTime CreatedAt
);

