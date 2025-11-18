using backend.Data;
using backend.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DebugController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("merchant")]
    public async Task<IActionResult> GetMerchant()
    {
        var merchant = await _db.Merchants.FirstOrDefaultAsync();
        return Ok(merchant);
    }

    [HttpGet("product")]
    public async Task<IActionResult> GetProduct()
    {
        var product = await _db.Products.FirstOrDefaultAsync();
        return Ok(product);
    }

    [HttpGet("service")]
    public async Task<IActionResult> GetService()
    {
        var service = await _db.Services.FirstOrDefaultAsync();
        return Ok(service);
    }

    [HttpGet("test-user")]
    public async Task<IActionResult> GetTestUser()
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == "test@temp.com");

        return Ok(user);
    }
}
