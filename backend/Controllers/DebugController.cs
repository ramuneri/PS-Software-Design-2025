using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    private const int TestMerchantId = 1;
    private const string TestEmployeeEmail = "test@temp.com";

    public DebugController(ApplicationDbContext db)
    {
        _db = db;
    }


    [HttpGet("merchant")]
    public async Task<IActionResult> GetMerchant()
    {
        var merchant = await _db.Merchants
            .Where(m => m.MerchantId == TestMerchantId)
            .FirstOrDefaultAsync();

        return merchant == null
            ? NotFound("Test merchant not found")
            : Ok(merchant);
    }


    [HttpGet("product")]
    public async Task<IActionResult> GetProduct()
    {
        var product = await _db.Products
            .Where(p => p.MerchantId == TestMerchantId)
            .FirstOrDefaultAsync();

        return product == null
            ? NotFound("Test product not found")
            : Ok(product);
    }


    [HttpGet("service")]
    public async Task<IActionResult> GetService()
    {
        var service = await _db.Services
            .Where(s => s.MerchantId == TestMerchantId)
            .FirstOrDefaultAsync();

        return service == null
            ? NotFound("Test service not found")
            : Ok(service);
    }


    [HttpGet("test-user")]
    public async Task<IActionResult> GetTestEmployee()
    {
        var employee = await _db.Users
            .Where(u =>
                u.Email == TestEmployeeEmail &&
                u.MerchantId == TestMerchantId)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.Role,
                u.MerchantId
            })
            .FirstOrDefaultAsync();

        return employee == null
            ? NotFound("Test employee user not found")
            : Ok(employee);
    }


    [HttpGet("test-customer")]
    public async Task<IActionResult> GetTestCustomer()
    {
        var customer = await _db.Users
            .Where(u =>
                u.Role == "Customer" &&
                u.MerchantId == TestMerchantId)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.Role,
                u.MerchantId
            })
            .FirstOrDefaultAsync();

        return customer == null
            ? NotFound("Test customer user not found")
            : Ok(customer);
    }
}
