namespace backend.Dtos;

public record PlanDto(
    int Id,
    string? Name,
    decimal Price,
    string? BillingPeriod,
    bool IsActive,
    DateTime CreatedAt,
    List<PlanFeatureDto>? Features
);