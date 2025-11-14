using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class MerchantSubscription
{
    [Key]
    public int Id { get; set; }

    public int MerchantId { get; set; }
    public int PlanId { get; set; }

    public DateTime StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string? Status { get; set; }
    public bool IsActive { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public Plan Plan { get; set; } = null!;
}