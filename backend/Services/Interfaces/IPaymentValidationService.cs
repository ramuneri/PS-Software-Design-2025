using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IPaymentValidationService
{
    (bool IsValid, string? Error) ValidatePayment(
        PaymentRequest payment,
        decimal remainingBalance);

    (bool IsValid, string? Error) ValidateCashPayment(
        PaymentRequest payment,
        decimal remainingBalance);

    (bool IsValid, string? Error) ValidateCardPayment(
        PaymentRequest payment);

    bool IsSupportedCurrency(string currency);
}