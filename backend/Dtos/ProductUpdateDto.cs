public class ProductUpdateDto
{
    public string? Name { get; set; }
    public decimal? Price { get; set; }
    public string? Category { get; set; }
    public int? TaxCategoryId { get; set; }
    public bool? IsActive { get; set; }
}
