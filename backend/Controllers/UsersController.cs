using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Enums;
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

    public UsersController(ApplicationDbContext db)
    {
        _db = db;
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
        return User.FindFirstValue("role");
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

        var query = _db.Users
            .Where(u => u.MerchantId == merchantId);

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
            return Forbid("Only Owners and SuperAdmins can manage users");

        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == merchantId);

        if (user == null)
            return NotFound();

        // Prevent changing role to Owner unless current user is SuperAdmin
        if (dto.Role == UserRoles.Owner && !IsCurrentUserSuperAdmin())
            return Forbid("Only SuperAdmins can assign Owner role");

        // Prevent changing SuperAdmin status
        if (dto.Role != null && user.IsSuperAdmin && dto.Role != user.Role)
            return Forbid("Cannot change role of SuperAdmin");

        if (dto.Name != null) user.Name = dto.Name;
        if (dto.Surname != null) user.Surname = dto.Surname;
        if (dto.PhoneNumber != null) user.PhoneNumber = dto.PhoneNumber;
        if (dto.Role != null) user.Role = dto.Role;

        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        if (!CanManageUsers())
            return Forbid("Only Owners and SuperAdmins can manage users");

        var merchantId = GetCurrentUserMerchantId();
        if (merchantId == null)
            return Unauthorized("Merchant ID not found in token");

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == merchantId);

        if (user == null)
            return NotFound();

        // Prevent deactivating SuperAdmins
        if (user.IsSuperAdmin)
            return Forbid("Cannot deactivate SuperAdmin");

        // Prevent deactivating yourself
        var currentUserId = GetCurrentUserId();
        if (currentUserId == id)
            return BadRequest("Cannot deactivate yourself");

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreUser(string id)
    {
        if (!CanManageUsers())
            return Forbid("Only Owners and SuperAdmins can manage users");

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
        return NoContent();
    }
}
