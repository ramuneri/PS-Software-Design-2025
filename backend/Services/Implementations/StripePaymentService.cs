using System.Collections.Concurrent;
using backend.Services.Interfaces;

namespace backend.Services;

public class StripePaymentService : IStripePaymentService
{
    // In-memory store for idempotency keys
    private static readonly ConcurrentDictionary<string, StripePaymentResult>
        _idempotencyStore = new();

    public async Task<StripePaymentResult> ProcessPaymentAsync(
        decimal amount,
        string currency,
        string idempotencyKey)
    {
        // Check idempotency - return cached result if key exists
        if (_idempotencyStore.TryGetValue(idempotencyKey, out var cachedResult))
        {
            return cachedResult;
        }

        // Simulate API call delay
        await Task.Delay(100);

        // Simulate Stripe payment processing
        var result = new StripePaymentResult();

        // Simulate 3DS requirement for amounts > 100
        if (amount > 100)
        {
            result.Success = false;
            result.Requires3DS = true;
            result.ErrorMessage = "3D Secure authentication required";
            result.PaymentIntentId = $"pi_{Guid.NewGuid():N}";
        }
        else
        {
            // Simulate successful payment
            result.Success = true;
            result.PaymentIntentId = $"pi_{Guid.NewGuid():N}";
            result.TransactionId = $"txn_{Guid.NewGuid():N}";
            result.Requires3DS = false;
        }

        // Store result for idempotency
        _idempotencyStore.TryAdd(idempotencyKey, result);

        return result;
    }
}