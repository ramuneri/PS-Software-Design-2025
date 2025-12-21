namespace backend.Data.Models;

public class AuditLog
{
    public int Id { get; set; }
    public int MerchantId { get; set; }
    public string Action { get; set; } = null!;
    public string AffectedUserId { get; set; } = null!;
    public string? PerformedByUserId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Merchant? Merchant { get; set; }
    public User? AffectedUser { get; set; }
}

