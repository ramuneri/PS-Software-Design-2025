using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GiftcardsController : ControllerBase
{
    private readonly IGiftCardService _service;

    public GiftcardsController(IGiftCardService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromHeader(Name = "X-Merchant-Id")] int merchantId,
        [FromQuery] string? code,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int limit = 10,
        [FromQuery] int offset = 0)
    {
        if (code != null)
        {
            var giftcard = await _service.GetByCodeAsync(code);
            return giftcard == null ? NotFound() : Ok(new { data = new[] { giftcard } });
        }

        var data = await _service.GetAllAsync(merchantId, includeInactive, limit, offset);
        return Ok(new { data });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GiftcardDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(new { data = result });
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<GiftcardDto>> Create(
        [FromHeader(Name = "X-Merchant-Id")] int merchantId,
        GiftcardCreateDto dto)
    {
        var created = await _service.CreateAsync(merchantId, dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, new { data = created });
    }

    [Authorize]
    [HttpPatch("{id:int}")]
    public async Task<ActionResult<GiftcardDto>> Update(int id, GiftcardUpdateDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return updated == null ? NotFound() : Ok(new { data = updated });
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
        => await _service.DeleteAsync(id) ? NoContent() : NotFound();

    [Authorize]
    [HttpPost("{id:int}/restore")]
    public async Task<ActionResult> Restore(int id)
        => await _service.RestoreAsync(id) ? NoContent() : NotFound();
}
