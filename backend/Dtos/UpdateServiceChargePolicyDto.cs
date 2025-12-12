namespace backend.Dtos;

public record UpdateServiceChargePolicyDto(
    string? Name,
    string? Type,
    decimal? Value,
    bool? IsActive,
    IEnumerable<int>? ServiceIds,
    IEnumerable<int>? OrderIds
);
