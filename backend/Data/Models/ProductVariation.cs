
using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class ProductVariation
{
    [Key]
    public int ProductVariationId { get; set; }

    public int ProductId { get; set; }
    
    public required string Name { get; set; }
    public decimal PriceAdjustment { get; set; }

    public Product Product { get; set; } = null!;
}
