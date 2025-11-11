using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class BusinessPricingPolicy
{
    [Key]
    public int Id { get; set; }

    public bool UnitPriceIncludesTax { get; set; }
    public bool MoneyRoundingMode { get; set; }
    public bool IsActive { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}