using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Refund
{
    [Key]
    public int RefundId { get; set; }

    public int PaymentId { get; set; }

    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }

    public Payment Payment { get; set; } = null!;
}