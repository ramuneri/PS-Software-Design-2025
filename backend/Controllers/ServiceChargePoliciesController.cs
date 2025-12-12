using backend.Dtos;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/service-charge-policies")]
[Authorize]
public class ServiceChargePoliciesController : ControllerBase
{
    private readonly IServiceChargePolicyService _service;

    public ServiceChargePoliciesController(
        IServiceChargePolicyService service)
    {
        _service = service;
    }

    // GET: api/service-charge-policies?merchantId=1&includeInactive=true
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceChargePolicyDto>>> GetAll(
        [FromQuery] int merchantId,
        [FromQuery] bool includeInactive = false)
    {
        var result = await _service.GetAllAsync(merchantId, includeInactive);
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
        => await _service.DeleteAsync(id) ? NoContent() : NotFound();


    [HttpPost("{id:int}/restore")]
    public async Task<IActionResult> Restore(int id)
        => await _service.RestoreAsync(id) ? NoContent() : NotFound();

}
