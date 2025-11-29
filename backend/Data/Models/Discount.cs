using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Discount
{
    [Key]
    public int Id { get; set; }
    public int? ProductId { get; set; }
    public int? ServiceId { get; set; }

    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public string? Scope { get; set; }
    public string? Type { get; set; }
    public decimal? Value { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public bool IsActive { get; set; }

    public ServiceChargePolicy? ServiceChargePolicy { get; set; }
}