namespace backend.Dtos;

public record PlanFeatureRequestDto(
    int FeatureId,
    int? LocationLimit
);
