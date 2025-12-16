using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? method)
    {
        var data = await paymentService.GetAllAsync(search, method);
        return Ok(new { data });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var payment = await paymentService.GetByIdAsync(id);
        return payment == null ? NotFound() : Ok(new { data = payment });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePaymentDto dto)
    {
        try
        {
            var created = await paymentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.PaymentId }, new { data = created });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdatePaymentDto dto)
    {
        try
        {
            var updated = await paymentService.UpdateAsync(id, dto);
            return updated == null ? NotFound() : Ok(new { data = updated });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => await paymentService.DeleteAsync(id) ? NoContent() : NotFound();
}
