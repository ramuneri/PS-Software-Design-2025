namespace backend.Dtos;

public class UpdateServiceRequest
{
    public string? Name { get; set; }
    public decimal? DefaultPrice { get; set; }
    public int? DurationMinutes { get; set; }
    public string? Description { get; set; }
    public int? TaxCategoryId { get; set; }
    public bool? IsActive { get; set; }
}
