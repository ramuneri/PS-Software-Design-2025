using backend.Data;
using backend.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    private const int TEST_MERCHANT_ID = 1;

    public UsersController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers(
        [FromQuery] string? role)
    {
        var query = _db.Users
            .Where(u => u.MerchantId == TEST_MERCHANT_ID);

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Role == role);
        }

        var users = await query
            .Select(u => new UserDto(
                u.Id,
                u.MerchantId,
                u.Email!,
                u.Name ?? "",
                u.Surname ?? "",
                u.PhoneNumber ?? "",
                u.Role,
                u.IsSuperAdmin,
                u.LastLoginAt,
                u.CreatedAt,
                u.UpdatedAt
            ))
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUserById(string id)
    {
        var user = await _db.Users
            .Where(u => u.Id == id)
            .Select(u => new UserDto(
                u.Id,
                u.MerchantId,
                u.Email!,
                u.Name ?? "",
                u.Surname ?? "",
                u.PhoneNumber ?? "",
                u.Role,
                u.IsSuperAdmin,
                u.LastLoginAt,
                u.CreatedAt,
                u.UpdatedAt
            ))
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateUser(
    string id,
    [FromBody] UpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound();

        if (dto.Name != null)
            user.Name = dto.Name;

        if (dto.Surname != null)
            user.Surname = dto.Surname;

        if (dto.PhoneNumber != null)
            user.PhoneNumber = dto.PhoneNumber;

        if (dto.Role != null)
            user.Role = dto.Role;

        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }


}
