using backend.Data;
using backend.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private const int TEST_MERCHANT_ID = 1;

    public UsersController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers(
        [FromQuery] string? role,
        [FromQuery] bool includeInactive = false)
    {
        var query = _db.Users
            .Where(u => u.MerchantId == TEST_MERCHANT_ID);

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
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == TEST_MERCHANT_ID);

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
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == TEST_MERCHANT_ID);

        if (user == null)
            return NotFound();

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
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == TEST_MERCHANT_ID);

        if (user == null)
            return NotFound();

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreUser(string id)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.MerchantId == TEST_MERCHANT_ID);

        if (user == null)
            return NotFound();

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
