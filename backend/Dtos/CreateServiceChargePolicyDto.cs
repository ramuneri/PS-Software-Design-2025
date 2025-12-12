namespace backend.Dtos;

public record CreateServiceChargePolicyDto(
    int MerchantId,
    string Name,
    string Type,
    decimal? Value,
    IEnumerable<int>? ServiceIds,
    IEnumerable<int>? OrderIds
);
