namespace backend.Dtos;

public record ServiceChargePolicyDto(
    int Id,
    int MerchantId,
    string Name,
    string Type,
    decimal? Value,
    bool IsActive,
    DateTime CreatedAt,
    IEnumerable<int> ServiceIds,
    IEnumerable<int> OrderIds
);
