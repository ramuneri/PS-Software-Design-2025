using backend.Data;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AuditLogsController(ApplicationDbContext db)
    {
        _db = db;
    }

    private int? GetCurrentUserMerchantId()
    {
        var merchantIdClaim = User.FindFirstValue("merchantId");
        if (string.IsNullOrEmpty(merchantIdClaim) || !int.TryParse(merchantIdClaim, out var merchantId))
            return null;
        return merchantId;
    }

    private bool IsCurrentUserSuperAdmin()
    {
        var isSuperAdminClaim = User.FindFirstValue("isSuperAdmin");
        return bool.TryParse(isSuperAdminClaim, out var isSuperAdmin) && isSuperAdmin;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? action,
        [FromQuery] string? affectedUserId,
        [FromQuery] int? limit = 100)
    {
        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        // Only SuperAdmins and Owners can view audit logs
        var isSuperAdmin = IsCurrentUserSuperAdmin();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
        if (!isSuperAdmin && role != "Owner")
            return StatusCode(403, "Only Owners and SuperAdmins can view audit logs");

        var query = _db.AuditLogs
            .Where(log => log.MerchantId == merchantId);

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(log => log.Action == action);

        if (!string.IsNullOrWhiteSpace(affectedUserId))
            query = query.Where(log => log.AffectedUserId == affectedUserId);

        var logs = await query
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit ?? 100)
            .Select(log => new AuditLogDto(
                log.Id,
                log.Action,
                log.PerformedByUserId,
                log.AffectedUserId,
                log.Description,
                log.CreatedAt
            ))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetUserAuditLogs(
        string userId,
        [FromQuery] int? limit = 50)
    {
        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        // Only SuperAdmins and Owners can view audit logs
        var isSuperAdmin = IsCurrentUserSuperAdmin();
        var role = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("role");
        if (!isSuperAdmin && role != "Owner")
            return StatusCode(403, "Only Owners and SuperAdmins can view audit logs");

        // Verify the user belongs to the same merchant
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.MerchantId == merchantId);

        if (user == null)
            return NotFound("User not found");

        var logs = await _db.AuditLogs
            .Where(log => log.MerchantId == merchantId && log.AffectedUserId == userId)
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit ?? 50)
            .Select(log => new AuditLogDto(
                log.Id,
                log.Action,
                log.PerformedByUserId,
                log.AffectedUserId,
                log.Description,
                log.CreatedAt
            ))
            .ToListAsync();

        return Ok(logs);
    }
}

