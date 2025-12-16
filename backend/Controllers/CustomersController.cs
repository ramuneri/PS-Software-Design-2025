using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController(ICustomerService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromHeader(Name = "X-Merchant-Id")] int merchantId,
        [FromQuery] string? q,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var data = await service.GetAllAsync(merchantId, q, includeInactive, limit, offset);
        return Ok(new { data });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var customer = await service.GetByIdAsync(id);
        return customer == null ? NotFound() : Ok(new { data = customer });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromHeader(Name = "X-Merchant-Id")] int merchantId,
        CustomerCreateDto dto)
    {
        var created = await service.CreateAsync(merchantId, dto);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new { data = created });
    }

    [Authorize]
    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, CustomerUpdateDto dto)
    {
        var updated = await service.UpdateAsync(id, dto);
        return updated == null ? NotFound() : Ok(new { data = updated });
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => await service.DeleteAsync(id) ? NoContent() : NotFound();

    [Authorize]
    [HttpPost("{id:int}/restore")]
    public async Task<IActionResult> Restore(int id)
        => await service.RestoreAsync(id) ? NoContent() : NotFound();
}
