using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlansController(IPlanService service) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var data = await service.GetPlansAsync(includeInactive);
        return Ok(new { data });
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Get(int id)
    {
        var plan = await service.GetPlanAsync(id);
        return plan == null ? NotFound() : Ok(new { data = plan });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(PlanCreateDto dto)
    {
        var created = await service.CreatePlanAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new { data = created });
    }

    [HttpPatch("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, PlanUpdateDto dto)
    {
        var updated = await service.UpdatePlanAsync(id, dto);
        return updated == null ? NotFound() : Ok(new { data = updated });
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
        => await service.DeletePlanAsync(id) ? NoContent() : NotFound();

    [HttpPost("{id:int}/restore")]
    [Authorize]
    public async Task<IActionResult> Restore(int id)
        => await service.RestorePlanAsync(id) ? NoContent() : NotFound();
}
