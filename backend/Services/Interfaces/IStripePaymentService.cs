using backend.Data.Models;

namespace backend.Services.Interfaces;

public interface IStripePaymentService
{
    Task<StripePaymentResult> ProcessPaymentAsync(
        decimal amount,
        string currency,
        string idempotencyKey);
}

public class StripePaymentResult
{
    public bool Success { get; set; }

    public string? PaymentIntentId { get; set; }

    public string? TransactionId { get; set; }

    public bool Requires3DS { get; set; }

    public string? ErrorMessage { get; set; }
}