using backend.Data.Models;
using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IOrderCalculatorService
{
    Task<OrderTotals> CalculateOrderTotalsAsync(Order order);
    Task<OrderTotals> CalculateOrderTotalsAsync(Order order, decimal? discountAmount = null, decimal? serviceChargeAmount = null, decimal? tipAmount = null);
}

public class OrderTotals
{
    public decimal Subtotal { get; set; }

    public decimal Tax { get; set; }

    public List<OrderTaxBreakdownDto> TaxBreakdown { get; set; } = new();

    public decimal ServiceCharge { get; set; }

    public decimal Discount { get; set; }

    public decimal Tip { get; set; }

    public decimal Total { get; set; }

    public decimal Paid { get; set; }

    public decimal Remaining { get; set; }
}
