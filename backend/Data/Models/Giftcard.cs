using System.ComponentModel.DataAnnotations;

namespace backend.Data.Models;

public class Giftcard
{
    [Key]
    public int GiftcardId { get; set; }

    public int MerchantId { get; set; }

    public string Code { get; set; } = null!;
    public decimal InitialBalance { get; set; }
    public decimal Balance { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public ICollection<GiftcardPayment> GiftcardPayments { get; set; } = new List<GiftcardPayment>();
}