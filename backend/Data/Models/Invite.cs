namespace backend.Data.Models;

public class Invite
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public int MerchantId { get; set; }
    public string InvitedByUserId { get; set; } = null!;
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public bool IsAccepted { get; set; }

    // Navigation properties
    public Merchant Merchant { get; set; } = null!;
    public User InvitedBy { get; set; } = null!;
}

