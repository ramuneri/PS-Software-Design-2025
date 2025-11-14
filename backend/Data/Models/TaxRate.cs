using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class TaxRate
{
    [Key]
    public int Id { get; set; }

    public int TaxCategoryId { get; set; }

    public decimal RatePercent { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    public TaxCategories TaxCategory { get; set; } = null!;
}