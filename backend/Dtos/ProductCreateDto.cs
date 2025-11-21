namespace backend.Dtos.Products;

public class ProductCreateDto
{
    public required string Name { get; set; }
    public required decimal Price { get; set; }
    public string? Category { get; set; }
    public int? TaxCategoryId { get; set; }
    public bool IsActive { get; set; } = true;
}
