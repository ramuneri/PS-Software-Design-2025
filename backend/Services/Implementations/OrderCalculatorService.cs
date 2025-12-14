using backend.Data.Models;
using backend.Services.Interfaces;

namespace backend.Services;

public class OrderCalculatorService : IOrderCalculatorService
{
    public OrderTotals CalculateOrderTotals(Order order)
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
        // TODO: Implement discount logic
        totals.Discount = 0;

        // 3. Calculate service charges
        // TODO: Implement service charge calculation
        totals.ServiceCharge = 0;

        // 4. Calculate tax (assuming 21% VAT for now)
        // TODO: Implement proper tax calculation based on tax rates and categories
        var subtotalAfterDiscount = totals.Subtotal - totals.Discount;
        totals.Tax = Math.Round(subtotalAfterDiscount * 0.21m, 2);

        // 5. Calculate tips
        totals.Tip = order.OrderTips?.Sum(t => t.Amount) ?? 0;

        // 6. Calculate total
        totals.Total = subtotalAfterDiscount + totals.Tax + totals.ServiceCharge;

        // 7. Calculate paid amount
        totals.Paid = order.Payments?
            .Where(p => p.PaymentStatus == "SUCCEEDED")
            .Sum(p => p.Amount) ?? 0;

        // 8. Calculate remaining
        totals.Remaining = Math.Max(0, totals.Total - totals.Paid);

        return totals;
    }
}