using System.Text.Json;
using backend.Data;
using backend.Data.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _db;

    public AuditLogService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task LogUserCreatedAsync(string userId, int merchantId, string? performedByUserId = null)
    {
        var log = new AuditLog
        {
            MerchantId = merchantId,
            Action = "USER_CREATED",
            AffectedUserId = userId,
            PerformedByUserId = performedByUserId,
            Description = performedByUserId != null
                ? "User was created"
                : "User was created via invite acceptance",
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task LogUserUpdatedAsync(string userId, int merchantId, Dictionary<string, object>? oldValues, Dictionary<string, object>? newValues, string? performedByUserId = null)
    {
        var changes = new List<string>();
        if (oldValues != null && newValues != null)
        {
            foreach (var key in newValues.Keys)
            {
                if (oldValues.ContainsKey(key) && oldValues[key]?.ToString() != newValues[key]?.ToString())
                {
                    changes.Add($"{key}: '{oldValues[key]}' → '{newValues[key]}'");
                }
            }
        }

        var log = new AuditLog
        {
            MerchantId = merchantId,
            Action = "USER_UPDATED",
            AffectedUserId = userId,
            PerformedByUserId = performedByUserId,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            Description = changes.Any() ? $"User was updated. Changes: {string.Join(", ", changes)}" : "User was updated",
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task LogUserDeactivatedAsync(string userId, int merchantId, string performedByUserId)
    {
        var log = new AuditLog
        {
            MerchantId = merchantId,
            Action = "USER_DEACTIVATED",
            AffectedUserId = userId,
            PerformedByUserId = performedByUserId,
            Description = "User was deactivated",
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task LogUserRestoredAsync(string userId, int merchantId, string performedByUserId)
    {
        var log = new AuditLog
        {
            MerchantId = merchantId,
            Action = "USER_RESTORED",
            AffectedUserId = userId,
            PerformedByUserId = performedByUserId,
            Description = "User was restored",
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task LogRoleChangedAsync(string userId, int merchantId, string oldRole, string newRole, string performedByUserId)
    {
        var log = new AuditLog
        {
            MerchantId = merchantId,
            Action = "ROLE_CHANGED",
            AffectedUserId = userId,
            PerformedByUserId = performedByUserId,
            OldValues = JsonSerializer.Serialize(new { Role = oldRole }),
            NewValues = JsonSerializer.Serialize(new { Role = newRole }),
            Description = $"User role changed from {oldRole} to {newRole}",
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }
}

