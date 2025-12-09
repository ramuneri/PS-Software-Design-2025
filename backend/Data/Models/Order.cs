using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Order
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int MerchantId { get; set; }
    
    public string? EmployeeId { get; set; }
    public string? CustomerIdentifier { get; set; }
    public int? BusinessPricingPolicyId { get; set; }
    public int? TipBasedOnDiscountId { get; set; }
    public User? Employee { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? Note { get; set; }
    public BusinessPricingPolicy? BusinessPricingPolicy { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Payment>? Payments { get; set; } = new List<Payment>();
    public ICollection<Refund>? Refunds { get; set; } = new List<Refund>();
    public ICollection<OrderTip>? OrderTips { get; set; } = new List<OrderTip>();
    public ICollection<ServiceChargePolicy>? ServiceChargePolicies { get; set; } = new List<ServiceChargePolicy>();
}