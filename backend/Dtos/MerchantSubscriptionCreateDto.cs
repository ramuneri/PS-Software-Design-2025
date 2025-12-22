namespace backend.Dtos;

public record MerchantSubscriptionCreateDto(
    int PlanId,
    DateTime StartsAt,
    DateTime? EndsAt
);
