namespace backend.Dtos;

public record PlanFeatureDto(
    int UniqueId,
    int PlanId,
    int? FeatureId,
    int? LocationLimit,
    string? FeatureName,
    string? FeatureDescription
);