using System.ComponentModel.DataAnnotations;

namespace backend.Dtos;

public class CreateServiceRequest
{
    [Required]
    public int MerchantId { get; set; }

    public int? TaxCategoryId { get; set; }

    [Required]
    public string Name { get; set; } = null!;

    [Required]
    public decimal DefaultPrice { get; set; }

    [Required]
    public int DurationMinutes { get; set; }

    [Required]
    public string Description { get; set; } = null!;

    public bool IsActive { get; set; } = true;
}
