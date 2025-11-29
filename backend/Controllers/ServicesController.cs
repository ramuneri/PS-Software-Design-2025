using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServicesService _services;

    public ServicesController(IServicesService services)
    {
        _services = services;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? taxCategoryId, [FromQuery] bool? active = true)
    {
        var data = await _services.GetAllAsync(taxCategoryId, active);
        return Ok(new { data });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var service = await _services.GetByIdAsync(id);
        if (service == null) return NotFound();
        return Ok(new { data = service });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(CreateServiceRequest request)
    {
        var created = await _services.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.ServiceId }, new { data = created });
    }

    [HttpPatch("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, UpdateServiceRequest request)
    {
        var updated = await _services.UpdateAsync(id, request);
        if (updated == null) return NotFound();
        return Ok(new { data = updated });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> SoftDelete(int id)
    {
        var success = await _services.SoftDeleteAsync(id);
        return success ? NoContent() : NotFound();
    }

    [HttpPost("{id}/restore")]
    [Authorize]
    public async Task<IActionResult> Restore(int id)
    {
        var success = await _services.RestoreAsync(id);
        return success ? NoContent() : NotFound();
    }
}
