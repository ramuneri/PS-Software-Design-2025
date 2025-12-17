namespace backend.Data.Models;

public class AuditLog
{
    public int Id { get; set; }
    public int MerchantId { get; set; }
    public string Action { get; set; } = null!; // e.g., "USER_CREATED", "USER_UPDATED", "USER_DEACTIVATED", "USER_RESTORED", "ROLE_CHANGED"
    public string AffectedUserId { get; set; } = null!; // The user being affected
    public string? PerformedByUserId { get; set; } // Who performed the action (null for system actions like invite acceptance)
    public string? OldValues { get; set; } // JSON string of old values (for updates)
    public string? NewValues { get; set; } // JSON string of new values
    public string? Description { get; set; } // Human-readable description
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Merchant? Merchant { get; set; }
    public User? AffectedUser { get; set; }
}

