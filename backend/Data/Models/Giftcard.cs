using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Giftcard
{
    [Key]
    public int GiftcardId { get; set; }

    public int MerchantId { get; set; }

    public string? Code { get; set; }
    public decimal InitialBalance { get; set; }
    public decimal Balance { get; set; }
    public DateTime? IssuedDate { get; set; }
    public DateTime? ExpirationDate { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public ICollection<GiftcardPayment> GiftcardPayments { get; set; } = new List<GiftcardPayment>();
}