namespace backend.Dtos;

public record DiscountDto(
    int Id,
    int? ProductId,
    int? ServiceId,
    string Name,
    string? Code,
    string? Scope,
    string? Type,
    decimal? Value,
    DateTime? StartsAt,
    DateTime? EndsAt,
    bool IsActive
);
