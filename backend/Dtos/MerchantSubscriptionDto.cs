namespace backend.Dtos;

public record MerchantSubscriptionDto(
    int Id,
    int MerchantId,
    int PlanId,
    DateTime StartsAt,
    DateTime? EndsAt,
    string? Status,
    bool IsActive,
    string? PlanName
);