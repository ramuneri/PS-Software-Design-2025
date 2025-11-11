using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class TaxCategories
{
    [Key]
    public int Id { get; set; }

    public int MerchantId { get; set; }

    public string? Name { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public ICollection<TaxRate> TaxRates { get; set; } = new List<TaxRate>();
}