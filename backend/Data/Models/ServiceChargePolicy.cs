using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class ServiceChargePolicy
{
    [Key]
    public int Id { get; set; }

    public int MerchantId { get; set; }
    public Merchant Merchant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;

    public decimal? Value { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    //  many-to-many navigations (match DB)
    public ICollection<ServiceServiceChargePolicy> ServiceLinks { get; set; } = new List<ServiceServiceChargePolicy>();
    public ICollection<OrderServiceChargePolicy> OrderLinks  { get; set; } = new List<OrderServiceChargePolicy>();
}
