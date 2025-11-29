using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Product
{
    [Key]
    public int ProductId { get; set; }

    public int MerchantId { get; set; }
    public int? TaxCategoryId { get; set; }

    public required string Name { get; set; }
    public decimal? Price { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public TaxCategories? TaxCategory { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}