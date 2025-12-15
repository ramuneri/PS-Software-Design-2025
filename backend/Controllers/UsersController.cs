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

    // GET /api/users?role=Employee
    // GET /api/users?role=Customer
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers([FromQuery] string role)
    {
        var users = await _db.Users
            .Where(u =>
                u.Role == role &&
                u.MerchantId == TEST_MERCHANT_ID)
            .Select(u => new UserListDto(
                u.Id,
                u.Email!,
                string.IsNullOrWhiteSpace(u.Name)
                    ? u.Email!
                    : u.Name
            ))
            .ToListAsync();

        return Ok(users);
    }
}
