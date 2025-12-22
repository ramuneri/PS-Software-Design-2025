using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeaturesController(IPlanService service) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var data = await service.GetFeaturesAsync(includeInactive);
        return Ok(new { data });
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Get(int id)
    {
        var feature = await service.GetFeatureAsync(id);
        return feature == null ? NotFound() : Ok(new { data = feature });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(FeatureCreateDto dto)
    {
        var created = await service.CreateFeatureAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new { data = created });
    }

    [HttpPatch("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, FeatureUpdateDto dto)
    {
        var updated = await service.UpdateFeatureAsync(id, dto);
        return updated == null ? NotFound() : Ok(new { data = updated });
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
        => await service.DeleteFeatureAsync(id) ? NoContent() : NotFound();

    [HttpPost("{id:int}/restore")]
    [Authorize]
    public async Task<IActionResult> Restore(int id)
        => await service.RestoreFeatureAsync(id) ? NoContent() : NotFound();
}
