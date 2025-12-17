using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Refund
{
    [Key]
    public int RefundId { get; set; }

    public int OrderId { get; set; }

    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public bool IsPartial { get; set; }
    public DateTime CreatedAt { get; set; }

    public Order Order { get; set; } = null!;
}