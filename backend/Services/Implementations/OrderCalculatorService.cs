using backend.Data.Models;
using backend.Services.Interfaces;

namespace backend.Services;

public class OrderCalculatorService : IOrderCalculatorService
{
    public OrderTotals CalculateOrderTotals(Order order)
    {
        return CalculateOrderTotals(order, null, null);
    }

    public OrderTotals CalculateOrderTotals(Order order, decimal? discountAmount = null, decimal? serviceChargeAmount = null)
    {
        var totals = new OrderTotals();

        // 1. Calculate subtotal from items
        totals.Subtotal = order.OrderItems?
            .Sum(item =>
            {
                var price = item.Product?.Price ?? item.Service?.DefaultPrice ?? 0;
                return price * item.Quantity;
            }) ?? 0;

        // 2. Calculate discounts
        totals.Discount = discountAmount ?? 0;

        // 3. Calculate service charges
        totals.ServiceCharge = serviceChargeAmount ?? 0;

        // 4. Tax calculation
        // Note: Tax is calculated based on subtotal after discount
        // This is a simplified calculation - the actual tax per item should be calculated
        // based on tax categories assigned to each product/service
        var subtotalAfterDiscount = totals.Subtotal - totals.Discount;
        
        // For now, use a default 21% rate, but ideally this should come from product tax categories
        // This matches the default tax rate used when products don't have specific tax categories
        totals.Tax = Math.Round(subtotalAfterDiscount * 0.21m, 2);

        // 5. Calculate tips
        totals.Tip = order.OrderTips?.Sum(t => t.Amount) ?? 0;

        // 6. Calculate total (includes all components)
        totals.Total = subtotalAfterDiscount + totals.Tax + totals.ServiceCharge;

        // 7. Calculate paid amount
        totals.Paid = order.Payments?
            .Where(p => p.PaymentStatus == "SUCCEEDED")
            .Sum(p => p.Amount) ?? 0;

        // 8. Calculate remaining (what still needs to be paid, excluding tips)
        totals.Remaining = Math.Max(0, totals.Total - totals.Paid);

        return totals;
    }
}