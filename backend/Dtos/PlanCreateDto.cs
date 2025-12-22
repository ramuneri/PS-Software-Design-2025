using System.Collections.Generic;

namespace backend.Dtos;

public record PlanCreateDto(
    string Name,
    decimal Price,
    string? BillingPeriod,
    bool IsActive,
    List<PlanFeatureRequestDto>? Features
);
