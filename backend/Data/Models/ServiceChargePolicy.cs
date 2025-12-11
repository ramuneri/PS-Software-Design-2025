using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class ServiceChargePolicy
{
    [Key]
    public int Id { get; set; }

    public int MerchantId { get; set; }
    public Merchant Merchant { get; set; } = null!;

    public string Name { get; set; } = "";
    public string Type { get; set; } = "";  // "fixed" or "percent"
    public decimal? Value { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Correct many-to-many navigations (match DB)
    public ICollection<ServiceServiceChargePolicy> Services { get; set; } = new List<ServiceServiceChargePolicy>();
    public ICollection<OrderServiceChargePolicy> Orders { get; set; } = new List<OrderServiceChargePolicy>();
}
