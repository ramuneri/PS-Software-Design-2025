using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class RefundService : IRefundService
{
    private readonly ApplicationDbContext context;
    private readonly IOrderCalculatorService orderCalculator;

    public RefundService(
        ApplicationDbContext context,
        IOrderCalculatorService orderCalculator)
    {
        this.context = context;
        this.orderCalculator = orderCalculator;
    }

    public async Task<RefundResponseDto?> CreateRefundAsync(int orderId, RefundRequestDto request)
    {
        using var transaction = await context.Database.BeginTransactionAsync();

        try
        {
            var order = await context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
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

            var orderTotals = await orderCalculator.CalculateOrderTotalsAsync(order);

            var totalRefundedAmount = order.Refunds?
                .Sum(r => r.Amount) ?? 0;
            var refundableAmount = orderTotals.Total - totalRefundedAmount;

            if (request.Amount <= 0)
                throw new InvalidOperationException("Refund amount must be greater than zero");

            if (request.Amount > refundableAmount)
                throw new InvalidOperationException(
                    $"Refund amount exceeds refundable amount. Refundable: {refundableAmount:F2}");

            var isPartialRefund = request.Amount < orderTotals.Total;

            var refund = new Refund
            {
                OrderId = orderId,
                Amount = request.Amount,
                Reason = request.Reason,
                IsPartial = isPartialRefund,
                CreatedAt = DateTime.UtcNow
            };

            context.Refunds.Add(refund);

            // Refund giftcards proportionally
            var totalPaymentAmount = order.Payments?.Sum(p => p.Amount) ?? 0;
            if (totalPaymentAmount > 0)
            {
                foreach (var payment in order.Payments ?? new List<Payment>())
                {
                    var paymentRatio = payment.Amount / totalPaymentAmount;
                    var paymentRefundAmount = request.Amount * paymentRatio;

                    foreach (var giftcardPayment in payment.GiftcardPayments)
                    {
                        var giftcardRefundAmount = giftcardPayment.AmountUsed > 0
                            ? paymentRefundAmount * (giftcardPayment.AmountUsed / payment.Amount)
                            : 0;

                        if (giftcardRefundAmount > 0)
                        {
                            giftcardPayment.Giftcard.Balance += giftcardRefundAmount;
                            giftcardPayment.Giftcard.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }
            }

            await context.SaveChangesAsync();
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
        var refund = await context.Refunds
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RefundId == refundId);

        if (refund == null)
            return null;

        return new RefundDto(
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
        var refunds = await context.Refunds
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
        )).ToList();
    }

    public async Task<IEnumerable<RefundDto>> GetAllRefundsAsync()
    {
        var refunds = await context.Refunds
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
        )).ToList();
    }
}
