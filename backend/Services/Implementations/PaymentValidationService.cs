using backend.Dtos;
using backend.Services.Interfaces;

namespace backend.Services;

public class PaymentValidationService : IPaymentValidationService
{
    private static readonly string[] SupportedCurrencies = { "EUR", "USD", "GBP" };
    private static readonly string[] SupportedMethods = { "CASH", "CARD", "GIFT_CARD" };

    public (bool IsValid, string? Error) ValidatePayment(
        PaymentRequest payment,
        decimal remainingBalance)
    {
        // Basic validations
        if (payment.Amount <= 0)
            return (false, "Amount must be positive");

        if (string.IsNullOrWhiteSpace(payment.Method))
            return (false, "Payment method is required");

        if (!SupportedMethods.Contains(payment.Method.ToUpperInvariant()))
            return (false, $"Payment method '{payment.Method}' is not supported");

        if (!IsSupportedCurrency(payment.Currency))
            return (false, $"Currency '{payment.Currency}' is not supported");

        // Method-specific validation
        return payment.Method.ToUpperInvariant() switch
        {
            "CASH" => ValidateCashPayment(payment, remainingBalance),
            "CARD" => ValidateCardPayment(payment),
            "GIFT_CARD" => (true, null), // Will be implemented in gift card phase
            _ => (false, $"Payment method '{payment.Method}' not implemented")
        };
    }

    public (bool IsValid, string? Error) ValidateCashPayment(
        PaymentRequest payment,
        decimal remainingBalance)
    {
        // Cash must cover at least the remaining balance
        if (payment.Amount < remainingBalance)
            return (false, $"Insufficient cash. Required: {remainingBalance:F2}, Provided: {payment.Amount:F2}");

        return (true, null);
    }

    public (bool IsValid, string? Error) ValidateCardPayment(PaymentRequest payment)
    {
        if (string.IsNullOrWhiteSpace(payment.Provider))
            return (false, "Card payments require a provider (e.g., 'STRIPE')");

        if (string.IsNullOrWhiteSpace(payment.IdempotencyKey))
            return (false, "Card payments require an idempotency key");

        if (payment.Provider.ToUpperInvariant() != "STRIPE")
            return (false, $"Payment provider '{payment.Provider}' is not supported");

        return (true, null);
    }

    public bool IsSupportedCurrency(string currency)
    {
        return SupportedCurrencies.Contains(currency?.ToUpperInvariant());
    }
}