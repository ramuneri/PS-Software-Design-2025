using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;

namespace backend.Services;

public class OrderCalculatorService : IOrderCalculatorService
{
    private readonly ITaxService _taxService;

    public OrderCalculatorService(ITaxService taxService)
    {
        _taxService = taxService;
    }

    public Task<OrderTotals> CalculateOrderTotalsAsync(Order order)
        => CalculateOrderTotalsAsync(order, null, null);

    public async Task<OrderTotals> CalculateOrderTotalsAsync(Order order, decimal? discountAmount = null, decimal? serviceChargeAmount = null)
    {
        var totals = new OrderTotals();

        decimal subtotal = 0;
        decimal taxTotal = 0;
        var breakdown = new Dictionary<(int CategoryId, decimal Rate), decimal>();

        foreach (var item in order.OrderItems ?? Enumerable.Empty<OrderItem>())
        {
            decimal itemTotal = 0;
            int? taxCategoryId = null;

            if (item.ProductId != null && item.Product != null)
            {
                var price = item.ProductVariationId != null && item.ProductVariation != null
                    ? item.ProductVariation.PriceAdjustment   // treat variation price as absolute
                    : item.Product.Price ?? 0;
                
                itemTotal = price * item.Quantity;
                taxCategoryId = item.Product.TaxCategoryId;
            }
            else if (item.ServiceId != null && item.Service != null)
            {
                var price = item.Service.DefaultPrice ?? 0;
                itemTotal = price * item.Quantity;
                taxCategoryId = item.Service.TaxCategoryId;
            }

            subtotal += itemTotal;

            if (taxCategoryId.HasValue)
            {
                var at = order.OpenedAt;
                var ratePercent = await _taxService.GetRatePercentAtAsync(taxCategoryId.Value, at);
                var itemTax = Math.Round(itemTotal * (ratePercent / 100m), 2);
                taxTotal += itemTax;

                var key = (taxCategoryId.Value, ratePercent);
                breakdown[key] = breakdown.GetValueOrDefault(key) + itemTax;
            }
        }

        totals.Subtotal = subtotal;
        totals.Tax = taxTotal;
        totals.TaxBreakdown = breakdown
            .Select(kvp => new OrderTaxBreakdownDto
            {
                TaxCategoryId = kvp.Key.CategoryId,
                CategoryName = string.Empty,
                RatePercent = kvp.Key.Rate,
                Amount = kvp.Value
            })
            .ToList();

        totals.Discount = discountAmount ?? 0;
        totals.ServiceCharge = serviceChargeAmount ?? 0;
        totals.Tip = order.OrderTips?.Sum(t => t.Amount) ?? 0;

        var subtotalAfterDiscount = Math.Max(0, subtotal - totals.Discount);
        totals.Total = subtotalAfterDiscount + totals.Tax + totals.ServiceCharge;

        totals.Paid = order.Payments?
            .Where(p => p.PaymentStatus == "SUCCEEDED")
            .Sum(p => p.Amount) ?? 0;

        totals.Remaining = Math.Max(0, totals.Total - totals.Paid);

        return totals;
    }
}
