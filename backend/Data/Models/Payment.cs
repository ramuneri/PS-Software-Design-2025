using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Payment
{
    [Key]
    public int PaymentId { get; set; }

    public int OrderId { get; set; }

    public string? Method { get; set; }
    public decimal Amount { get; set; }
    public string? Provider { get; set; }
    public string? Currency { get; set; }
    public string? PaymentStatus { get; set; }

    public Order Order { get; set; } = null!;
    public ICollection<GiftcardPayment> GiftcardPayments { get; set; } = new List<GiftcardPayment>();
}