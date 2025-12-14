using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _service;

    public ReservationsController(IReservationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAll(
        [FromQuery] bool includeInactive = false)
    {
        return Ok(await _service.GetAllAsync(includeInactive));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ReservationDto>> GetById(int id)
    {
        var reservation = await _service.GetByIdAsync(id);
        return reservation == null ? NotFound() : Ok(reservation);
    }

    [HttpPost]
    public async Task<ActionResult<ReservationDto>> Create(
        [FromBody] CreateReservationDto dto)
    {
        var created = await _service.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            created);
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ReservationDto>> Update(
        int id,
        [FromBody] UpdateReservationDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return updated == null ? NotFound() : Ok(updated);
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelExplicit(int id)
    => await _service.CancelAsync(id) ? NoContent() : NotFound();


    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
        => await _service.CancelAsync(id) ? NoContent() : NotFound();

    [HttpPost("{id:int}/restore")]
    public async Task<IActionResult> Restore(int id)
        => await _service.RestoreAsync(id) ? NoContent() : NotFound();
}
