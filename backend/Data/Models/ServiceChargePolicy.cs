using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class ServiceChargePolicy
{
    [Key]
    public int Id { get; set; }

    public int? ServiceChargePolicyId { get; set; }
    public int? OrderId { get; set; }

    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public decimal? Value { get; set; }
    public bool IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }

    public ICollection<Service> Services { get; set; } = new List<Service>();
    public ICollection<Discount> Discounts { get; set; } = new List<Discount>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}