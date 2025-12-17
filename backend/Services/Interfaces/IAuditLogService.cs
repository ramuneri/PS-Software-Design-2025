namespace backend.Services.Interfaces;

public interface IAuditLogService
{
    Task LogUserCreatedAsync(string userId, int merchantId, string? performedByUserId = null);
    Task LogUserUpdatedAsync(string userId, int merchantId, Dictionary<string, object>? oldValues, Dictionary<string, object>? newValues, string? performedByUserId = null);
    Task LogUserDeactivatedAsync(string userId, int merchantId, string performedByUserId);
    Task LogUserRestoredAsync(string userId, int merchantId, string performedByUserId);
    Task LogRoleChangedAsync(string userId, int merchantId, string oldRole, string newRole, string performedByUserId);
}

