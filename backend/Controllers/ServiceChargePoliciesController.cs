using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/service-charge-policies")]
public class ServiceChargePoliciesController : ControllerBase
{
    private readonly IServiceChargePolicyService _service;

    public ServiceChargePoliciesController(
        IServiceChargePolicyService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceChargePolicyDto>>> GetAll(
        [FromQuery] int merchantId)
    {
        var result = await _service.GetAllAsync(merchantId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ServiceChargePolicyDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);

        if (result is null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ServiceChargePolicyDto>> Create(
        [FromBody] CreateServiceChargePolicyDto dto)
    {
        var created = await _service.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            created);
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ServiceChargePolicyDto>> Patch(
        int id,
        [FromBody] UpdateServiceChargePolicyDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);

        if (updated is null)
            return NotFound();

        return Ok(updated);
    }


    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);

        if (!success)
            return NotFound();

        return NoContent();
    }
}
