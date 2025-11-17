namespace backend.Dtos;

public record OrderTipDto(
    int Id,
    int OrderId,
    string? Source,
    decimal Amount,
    DateTime? CreatedAt
);