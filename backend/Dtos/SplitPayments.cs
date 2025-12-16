using backend.Services.Interfaces;

namespace backend.Dtos;

public record SplitPaymentRequest(
    IEnumerable<int> OrderItemIds,
    string Method,
    string Currency
);

public record SplitCloseOrderRequest(
    List<SplitPaymentRequest> Splits,
    TipRequest? Tip,
    decimal? DiscountAmount,
    decimal? ServiceChargeAmount
);
