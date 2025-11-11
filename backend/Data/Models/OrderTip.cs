using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class OrderTip
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }

    public string? Source { get; set; }
    public decimal Amount { get; set; }
    public DateTime? CreatedAt { get; set; }

    public Order Order { get; set; } = null!;
}