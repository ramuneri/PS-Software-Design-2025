using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Data.Models;

public class GiftcardPayment
{
    [Key, Column(Order = 0)]
    public int PaymentId { get; set; }

    [Key, Column(Order = 1)]
    public int GiftcardId { get; set; }

    public decimal AmountUsed { get; set; }

    public Payment Payment { get; set; } = null!;
    public Giftcard Giftcard { get; set; } = null!;
}