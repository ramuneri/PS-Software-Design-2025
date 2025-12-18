using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class RefundService : IRefundService
{
    private readonly ApplicationDbContext _db;
    private readonly IOrderCalculatorService _orderCalculator;

    public RefundService(ApplicationDbContext db, IOrderCalculatorService orderCalculator)
    {
        _db = db;
        _orderCalculator = orderCalculator;
    }

    public async Task<RefundResponseDto?> CreateRefundAsync(int orderId, RefundRequestDto request)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            var order = await _db.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.ProductVariation)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Service)
                .Include(o => o.Payments!)
                    .ThenInclude(p => p.GiftcardPayments)
                        .ThenInclude(gp => gp.Giftcard)
                .Include(o => o.Refunds)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.ClosedAt == null)
                throw new InvalidOperationException("Only closed (paid) orders can be refunded");

            if (order.CancelledAt != null)
                throw new InvalidOperationException("Cannot refund a cancelled order");

            if (request.Amount <= 0)
                throw new InvalidOperationException("Refund amount must be greater than zero");

            var totals = await _orderCalculator.CalculateOrderTotalsAsync(order);

            var alreadyRefunded = order.Refunds?.Sum(r => r.Amount) ?? 0m;
            var refundableAmount = Math.Max(0m, totals.Total - alreadyRefunded);

            if (request.Amount > refundableAmount)
                throw new InvalidOperationException(
                    $"Refund amount exceeds refundable amount. Refundable: {refundableAmount:F2}");

            var refund = new Refund
            {
                OrderId = orderId,
                Amount = request.Amount,
                Reason = request.Reason,
                IsPartial = request.Amount < totals.Total,
                CreatedAt = DateTime.UtcNow
            };

            _db.Refunds.Add(refund);

            // Refund giftcards proportionally based on how much each payment contributed.
            var totalPaymentAmount = order.Payments?.Sum(p => p.Amount) ?? 0m;
            if (totalPaymentAmount > 0m)
            {
                foreach (var payment in order.Payments ?? new List<Payment>())
                {
                    if (payment.Amount <= 0m) continue;

                    var paymentRatio = payment.Amount / totalPaymentAmount;
                    var paymentRefundAmount = request.Amount * paymentRatio;

                    foreach (var giftcardPayment in payment.GiftcardPayments ?? new List<GiftcardPayment>())
                    {
                        if (giftcardPayment.AmountUsed <= 0m) continue;
                        if (giftcardPayment.Giftcard == null) continue;

                        var portion = giftcardPayment.AmountUsed / payment.Amount;
                        var giftcardRefundAmount = paymentRefundAmount * portion;

                        if (giftcardRefundAmount <= 0m) continue;

                        giftcardPayment.Giftcard.Balance += giftcardRefundAmount;
                        giftcardPayment.Giftcard.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return new RefundResponseDto(
                refund.RefundId,
                refund.OrderId,
                refund.Amount,
                refund.Reason,
                refund.IsPartial,
                refund.CreatedAt
            );
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<RefundDto?> GetRefundByIdAsync(int refundId)
    {
        var refund = await _db.Refunds
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RefundId == refundId);

        return refund == null
            ? null
            : new RefundDto(
                refund.RefundId,
                refund.OrderId,
                refund.Amount,
                refund.Reason,
                refund.IsPartial,
                refund.CreatedAt
            );
    }

    public async Task<IEnumerable<RefundDto>> GetRefundsByOrderIdAsync(int orderId)
    {
        var refunds = await _db.Refunds
            .AsNoTracking()
            .Where(r => r.OrderId == orderId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return refunds.Select(r => new RefundDto(
            r.RefundId,
            r.OrderId,
            r.Amount,
            r.Reason,
            r.IsPartial,
            r.CreatedAt
        ));
    }

    public async Task<IEnumerable<RefundDto>> GetAllRefundsAsync()
    {
        var refunds = await _db.Refunds
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return refunds.Select(r => new RefundDto(
            r.RefundId,
            r.OrderId,
            r.Amount,
            r.Reason,
            r.IsPartial,
            r.CreatedAt
        ));
    }
}

