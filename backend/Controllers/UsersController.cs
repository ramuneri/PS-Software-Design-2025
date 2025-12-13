using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees([FromQuery] int merchantId)
        => Ok(await _service.GetEmployeesAsync(merchantId));

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers([FromQuery] int merchantId)
        => Ok(await _service.GetCustomersAsync(merchantId));
}
