namespace backend.Dtos;

// Main request for closing order with payments
public record CloseOrderRequest(
    List<PaymentRequest> Payments,
    TipRequest? Tip = null,
    decimal? DiscountAmount = null,
    decimal? ServiceChargeAmount = null
);

// Individual payment within close order request
public record PaymentRequest(
    string Method,           // "CASH", "CARD", "GIFT_CARD"
    decimal Amount,
    string Currency,
    string? Provider = null, // Required for CARD (e.g., "STRIPE")
    string? IdempotencyKey = null, // Required for CARD to prevent double-charge
    string? GiftCardCode = null // Required for GIFT_CARD
);

// Tip information
public record TipRequest(
    string Source,   // "CASH", "CARD", etc.
    decimal Amount
);

// Response for close order operation
public record CloseOrderResponse(
    OrderDto Order,
    decimal? Change = null,           // For cash payments
    string? PaymentIntentId = null,   // For card payments
    bool? Requires3DS = false         // For card payments requiring 3D Secure
);