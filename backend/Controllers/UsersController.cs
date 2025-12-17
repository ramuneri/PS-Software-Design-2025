using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Enums;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IAuditLogService _auditLogService;

    public UsersController(ApplicationDbContext db, IAuditLogService auditLogService)
    {
        _db = db;
        _auditLogService = auditLogService;
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
    }

    private int? GetCurrentUserMerchantId()
    {
        var merchantIdClaim = User.FindFirstValue("merchantId");
        if (string.IsNullOrEmpty(merchantIdClaim) || !int.TryParse(merchantIdClaim, out var merchantId))
            return null;
        return merchantId;
    }

    private string? GetCurrentUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role");
    }

    private bool IsCurrentUserSuperAdmin()
    {
        var isSuperAdminClaim = User.FindFirstValue("isSuperAdmin");
        return bool.TryParse(isSuperAdminClaim, out var isSuperAdmin) && isSuperAdmin;
    }

    private bool CanManageUsers()
    {
        var role = GetCurrentUserRole();
        return IsCurrentUserSuperAdmin() || role == UserRoles.Owner;
    }


    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers(
        [FromQuery] string? role,
        [FromQuery] bool includeInactive = false)
    {
        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        // Ensure customers can be selected in reservation dropdowns even if they were created
        // through the Customer API (which stores a separate Customer record).
        if (string.Equals(role, UserRoles.Customer, StringComparison.OrdinalIgnoreCase))
        {
            await EnsureCustomerIdentityUsers(merchantId.Value);
        }

        var query = _db.Users
            .Where(u => u.MerchantId == merchantId.Value);

        if (!includeInactive)
            query = query.Where(u => u.IsActive);

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Role == role);

        var users = await query
            .OrderBy(u => u.Email)
            .Select(u => new UserListDto(
                u.Id,
                u.Email ?? "",
                string.IsNullOrWhiteSpace(u.Name) ? (u.Email ?? "") : u.Name!,
                u.PhoneNumber,
                u.Role,
                u.IsActive,
                u.LastLoginAt
            ))
            .ToListAsync();

        return Ok(users);
    }

    private async Task EnsureCustomerIdentityUsers(int merchantId)
    {
        // For any customer without a matching identity user, create a lightweight user entry
        // so they appear in dropdowns (reservations customer selection).
        var customers = await _db.Customers
            .Where(c => c.MerchantId == merchantId)
            .ToListAsync();

        var existingNormalizedEmails = await _db.Users
            .Where(u => u.MerchantId == merchantId)
            .Select(u => u.NormalizedEmail)
            .ToListAsync();

        var toAdd = new List<backend.Data.Models.User>();
        var now = DateTime.UtcNow;

        foreach (var c in customers)
        {
            var email = c.Email?.Trim() ?? string.Empty;
            var normalizedEmail = string.IsNullOrWhiteSpace(email) ? null : email.ToUpperInvariant();

            var alreadyHasUser = !string.IsNullOrWhiteSpace(normalizedEmail) &&
                                 existingNormalizedEmails.Any(e => e == normalizedEmail);
            if (alreadyHasUser) continue;

            var userId = Guid.NewGuid().ToString();
            var username = string.IsNullOrWhiteSpace(email)
                ? $"customer-{userId}"
                : email;

            toAdd.Add(new backend.Data.Models.User
            {
                Id = userId,
                MerchantId = merchantId,
                Name = c.Name,
                Surname = c.Surname,
                Email = email,
                NormalizedEmail = normalizedEmail,
                UserName = username,
                NormalizedUserName = username.ToUpperInvariant(),
                PhoneNumber = c.Phone,
                Role = "Customer",
                IsActive = c.IsActive,
                EmailConfirmed = false,
                PhoneNumberConfirmed = false,
                TwoFactorEnabled = false,
                LockoutEnabled = false,
                AccessFailedCount = 0,
                PasswordHash = string.Empty,
                CreatedAt = now,
                UpdatedAt = now,
                LastLoginAt = now,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            });
        }

        if (toAdd.Count > 0)
        {
            _db.Users.AddRange(toAdd);
            await _db.SaveChangesAsync();
        }
    }


    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUserById(string id)
    {
        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == merchantId);

        if (user == null)
            return NotFound();

        return Ok(new UserDto(
            user.Id,
            user.MerchantId,
            user.Email ?? "",
            user.Name ?? "",
            user.Surname ?? "",
            user.PhoneNumber ?? "",
            user.Role,
            user.IsSuperAdmin,
            user.IsActive,
            user.LastLoginAt,
            user.CreatedAt,
            user.UpdatedAt
        ));
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        if (!CanManageUsers())
            return StatusCode(403, "Only Owners and SuperAdmins can manage users");

        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == merchantId);

        if (user == null)
            return NotFound();

        // Prevent changing role to Owner unless current user is SuperAdmin
        if (dto.Role == UserRoles.Owner && !IsCurrentUserSuperAdmin())
            return StatusCode(403, "Only SuperAdmins can assign Owner role");

        // Prevent changing SuperAdmin status
        if (dto.Role != null && user.IsSuperAdmin && dto.Role != user.Role)
            return StatusCode(403, "Cannot change role of SuperAdmin");

        // Track old values for audit log
        var oldValues = new Dictionary<string, object>();
        var newValues = new Dictionary<string, object>();
        bool roleChanged = false;
        string? oldRole = null;

        if (dto.Role != null && dto.Role != user.Role)
        {
            oldRole = user.Role;
            roleChanged = true;
            oldValues["Role"] = user.Role;
            newValues["Role"] = dto.Role;
        }

        if (dto.Name != null && dto.Name != user.Name)
        {
            oldValues["Name"] = user.Name ?? "";
            newValues["Name"] = dto.Name;
            user.Name = dto.Name;
        }
        if (dto.Surname != null && dto.Surname != user.Surname)
        {
            oldValues["Surname"] = user.Surname ?? "";
            newValues["Surname"] = dto.Surname;
            user.Surname = dto.Surname;
        }
        if (dto.PhoneNumber != null && dto.PhoneNumber != user.PhoneNumber)
        {
            oldValues["PhoneNumber"] = user.PhoneNumber ?? "";
            newValues["PhoneNumber"] = dto.PhoneNumber;
            user.PhoneNumber = dto.PhoneNumber;
        }
        if (dto.Role != null)
        {
            user.Role = dto.Role;
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Log audit entry
        var currentUserId = GetCurrentUserId();

        if (roleChanged && oldRole != null)
        {
            // Log role change separately as it's a critical action
            await _auditLogService.LogRoleChangedAsync(
                user.Id,
                merchantId.Value,
                oldRole,
                dto.Role!,
                currentUserId!
            );
        }
        else if (oldValues.Any())
        {
            // Log general update
            await _auditLogService.LogUserUpdatedAsync(
                user.Id,
                merchantId.Value,
                oldValues.Any() ? oldValues : null,
                newValues.Any() ? newValues : null,
                currentUserId
            );
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        if (!CanManageUsers())
            return StatusCode(403, "Only Owners and SuperAdmins can manage users");

        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == merchantId);

        if (user == null)
            return NotFound();

        // Prevent deactivating SuperAdmins
        if (user.IsSuperAdmin)
            return StatusCode(403, "Cannot deactivate SuperAdmin");

        // Prevent deactivating yourself
        var currentUserId = GetCurrentUserId();
        if (currentUserId == id)
            return BadRequest("Cannot deactivate yourself");

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Log audit entry
        await _auditLogService.LogUserDeactivatedAsync(
            user.Id,
            merchantId.Value,
            currentUserId!
        );

        return NoContent();
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreUser(string id)
    {
        if (!CanManageUsers())
            return StatusCode(403, "Only Owners and SuperAdmins can manage users");

        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == merchantId);

        if (user == null)
            return NotFound();

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Log audit entry
        var currentUserId = GetCurrentUserId();
        await _auditLogService.LogUserRestoredAsync(
            user.Id,
            merchantId.Value,
            currentUserId!
        );

        return NoContent();
    }
}
