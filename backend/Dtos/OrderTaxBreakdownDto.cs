namespace backend.Dtos;

public class OrderTaxBreakdownDto
{
    public int TaxCategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal RatePercent { get; set; }
    public decimal Amount { get; set; }
}
