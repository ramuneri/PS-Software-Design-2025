using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Plan
{
    [Key]
    public int Id { get; set; }

    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string? BillingPeriod { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<MerchantSubscription> Subscriptions { get; set; } = new List<MerchantSubscription>();
    public ICollection<PlanFeature> PlanFeatures { get; set; } = new List<PlanFeature>();
}