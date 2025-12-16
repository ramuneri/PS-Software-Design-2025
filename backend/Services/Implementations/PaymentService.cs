using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class PaymentService(ApplicationDbContext context) : IPaymentService
{
    public async Task<IEnumerable<PaymentDto>> GetAllAsync(string? search, string? method)
    {
        var query = context.Payments.AsQueryable();

        if (!string.IsNullOrWhiteSpace(method))
        {
            var normalized = method.Trim().ToUpperInvariant();
            query = query.Where(p => p.Method != null && p.Method.ToUpper() == normalized);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var hasOrderId = int.TryParse(term, out var orderId);

            query = query.Where(p =>
                (!string.IsNullOrEmpty(p.Method) && EF.Functions.ILike(p.Method, $"%{term}%")) ||
                (!string.IsNullOrEmpty(p.PaymentStatus) && EF.Functions.ILike(p.PaymentStatus, $"%{term}%")) ||
                (hasOrderId && p.OrderId == orderId)
            );
        }

        return await query
            .OrderByDescending(p => p.PaymentId)
            .AsNoTracking()
            .Select(p => new PaymentDto(
                p.PaymentId,
                p.OrderId,
                p.Method,
                p.Amount,
                p.Provider,
                p.Currency,
                p.PaymentStatus
            ))
            .ToListAsync();
    }

    public async Task<PaymentDto?> GetByIdAsync(int paymentId)
    {
        var payment = await context.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

        return payment == null ? null : ToDto(payment);
    }

    public async Task<PaymentDto> CreateAsync(CreatePaymentDto dto)
    {
        ValidateCreate(dto);

        var orderExists = await context.Orders.AnyAsync(o => o.Id == dto.OrderId);
        if (!orderExists)
        {
            throw new InvalidOperationException("Order not found.");
        }

        var payment = new Payment
        {
            OrderId = dto.OrderId,
            Method = dto.Method.Trim().ToUpperInvariant(),
            Amount = dto.Amount,
            Provider = dto.Provider?.Trim(),
            Currency = NormalizeCurrency(dto.Currency),
            PaymentStatus = NormalizeStatus(dto.PaymentStatus) ?? "SUCCEEDED"
        };

        context.Payments.Add(payment);
        await context.SaveChangesAsync();

        return ToDto(payment);
    }

    public async Task<PaymentDto?> UpdateAsync(int paymentId, UpdatePaymentDto dto)
    {
        var payment = await context.Payments.FirstOrDefaultAsync(p => p.PaymentId == paymentId);
        if (payment == null)
        {
            return null;
        }

        if (dto.OrderId.HasValue && dto.OrderId.Value != payment.OrderId)
        {
            var orderExists = await context.Orders.AnyAsync(o => o.Id == dto.OrderId.Value);
            if (!orderExists)
            {
                throw new InvalidOperationException("Order not found.");
            }

            payment.OrderId = dto.OrderId.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.Method))
        {
            payment.Method = dto.Method.Trim().ToUpperInvariant();
        }

        if (dto.Amount.HasValue)
        {
            if (dto.Amount.Value <= 0)
            {
                throw new InvalidOperationException("Amount must be greater than zero.");
            }

            payment.Amount = dto.Amount.Value;
        }

        if (dto.Currency != null)
        {
            payment.Currency = NormalizeCurrency(dto.Currency);
        }

        if (dto.PaymentStatus != null)
        {
            payment.PaymentStatus = NormalizeStatus(dto.PaymentStatus);
        }

        if (dto.Provider != null)
        {
            payment.Provider = dto.Provider.Trim();
        }

        await context.SaveChangesAsync();
        return ToDto(payment);
    }

    public async Task<bool> DeleteAsync(int paymentId)
    {
        var payment = await context.Payments.FirstOrDefaultAsync(p => p.PaymentId == paymentId);
        if (payment == null)
        {
            return false;
        }

        context.Payments.Remove(payment);
        await context.SaveChangesAsync();
        return true;
    }

    private static void ValidateCreate(CreatePaymentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Method))
        {
            throw new InvalidOperationException("Payment method is required.");
        }

        if (dto.Amount <= 0)
        {
            throw new InvalidOperationException("Amount must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(dto.Currency))
        {
            throw new InvalidOperationException("Currency is required.");
        }
    }

    private static string NormalizeCurrency(string? currency)
        => string.IsNullOrWhiteSpace(currency) ? "EUR" : currency.Trim().ToUpperInvariant();

    private static string? NormalizeStatus(string? status)
        => string.IsNullOrWhiteSpace(status) ? null : status.Trim().ToUpperInvariant();

    private static PaymentDto ToDto(Payment payment)
        => new(
            payment.PaymentId,
            payment.OrderId,
            payment.Method,
            payment.Amount,
            payment.Provider,
            payment.Currency,
            payment.PaymentStatus
        );
}
