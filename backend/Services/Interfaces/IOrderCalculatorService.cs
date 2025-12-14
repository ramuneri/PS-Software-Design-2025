using backend.Data.Models;

namespace backend.Services.Interfaces;

public interface IOrderCalculatorService
{
    OrderTotals CalculateOrderTotals(Order order);
}

public class OrderTotals
{
    public decimal Subtotal { get; set; }

    public decimal Tax { get; set; }

    public decimal ServiceCharge { get; set; }

    public decimal Discount { get; set; }

    public decimal Tip { get; set; }

    public decimal Total { get; set; }

    public decimal Paid { get; set; }

    public decimal Remaining { get; set; }
}