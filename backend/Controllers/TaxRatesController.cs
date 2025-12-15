using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("tax/rates")]
public class TaxRatesController : ControllerBase
{
    private readonly ITaxService _taxService;

    public TaxRatesController(ITaxService taxService)
    {
        _taxService = taxService;
    }

    private static decimal ToPercent(decimal rateDecimal) => rateDecimal * 100m;
    private static decimal ToDecimalRate(decimal ratePercent) => ratePercent / 100m;

    [HttpGet]
    public async Task<ActionResult<object>> GetRates([FromHeader(Name = "X-Merchant-Id")] string? merchantId, [FromQuery] int? taxCategoryId, [FromQuery] DateTime? asOf, [FromQuery] bool includeInactive = false)
    {
        var rates = await _taxService.GetRatesAsync(taxCategoryId, asOf, includeInactive);
        var data = rates.Select(r => new
        {
            r.Id,
            r.TaxCategoryId,
            rate = ToDecimalRate(r.RatePercent),
            r.EffectiveFrom,
            r.EffectiveTo,
            r.IsActive
        });
        return Ok(new { data });
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<object>> Create([FromHeader(Name = "X-Merchant-Id")] string? merchantId, [FromBody] TaxRateCreateRequest request)
    {
        var dto = new TaxRateDto(0, request.TaxCategoryId, ToPercent(request.Rate), request.EffectiveFrom, request.EffectiveTo);
        var created = await _taxService.AddRateAsync(request.TaxCategoryId, dto);
        if (created == null) return NotFound();

        return CreatedAtAction(nameof(GetRate), new { id = created.Id }, new
        {
            data = new
            {
                created.Id,
                created.TaxCategoryId,
                rate = ToDecimalRate(created.RatePercent),
                created.EffectiveFrom,
                created.EffectiveTo,
                created.IsActive
            }
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetRate(int id)
    {
        var rate = await _taxService.GetRateAsync(id);
        if (rate == null) return NotFound();
        return Ok(new
        {
            data = new
            {
                rate.Id,
                rate.TaxCategoryId,
                rate = ToDecimalRate(rate.RatePercent),
                rate.EffectiveFrom,
                rate.EffectiveTo,
                rate.IsActive
            }
        });
    }

    [HttpPatch("{id:int}")]
    [Authorize]
    public async Task<ActionResult<object>> Update(int id, [FromBody] TaxRateUpdateRequest request)
    {
        var dto = new TaxRateDto(id, request.TaxCategoryId, ToPercent(request.Rate), request.EffectiveFrom ?? DateTime.UtcNow, request.EffectiveTo);
        var updated = await _taxService.UpdateRateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(new
        {
            data = new
            {
                updated.Id,
                updated.TaxCategoryId,
                rate = ToDecimalRate(updated.RatePercent),
                updated.EffectiveFrom,
                updated.EffectiveTo,
                updated.IsActive
            }
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _taxService.DeleteRateAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/restore")]
    [Authorize]
    public async Task<IActionResult> Restore(int id)
    {
        var restored = await _taxService.RestoreRateAsync(id);
        return restored ? NoContent() : NotFound();
    }

    public record TaxRateCreateRequest(int TaxCategoryId, decimal Rate, DateTime EffectiveFrom, DateTime? EffectiveTo);
    public record TaxRateUpdateRequest(int TaxCategoryId, decimal Rate, DateTime? EffectiveFrom, DateTime? EffectiveTo);
}
