using backend.Dtos;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscountsController : ControllerBase
{
    private readonly IDiscountService _service;

    public DiscountsController(IDiscountService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DiscountDto>>> GetAll([FromQuery] bool includeInactive = false)
        => Ok(await _service.GetAllAsync(includeInactive));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DiscountDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }



    [Authorize]
    [HttpPost]
    public async Task<ActionResult<DiscountDto>> Create(CreateDiscountDto dto)
    {
        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize]
    [HttpPatch("{id:int}")]
    public async Task<ActionResult<DiscountDto>> Update(int id, UpdateDiscountDto dto)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, dto);
            return updated == null ? NotFound() : Ok(updated);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
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
