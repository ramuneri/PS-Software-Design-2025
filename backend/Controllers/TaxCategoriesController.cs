using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("tax/categories")]
public class TaxCategoriesController : ControllerBase
{
    private readonly ITaxService _taxService;

    public TaxCategoriesController(ITaxService taxService)
    {
        _taxService = taxService;
    }

    private static decimal ToPercent(decimal rateDecimal) => rateDecimal * 100m;
    private static decimal ToDecimalRate(decimal ratePercent) => ratePercent / 100m;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll([FromHeader(Name = "X-Merchant-Id")] string? merchantId, [FromQuery] bool includeInactive = false)
    {
        var categories = await _taxService.GetCategoriesAsync(includeInactive);
        var data = categories.Select(tc => new
        {
            tc.Id,
            tc.MerchantId,
            tc.Name,
            tc.IsActive,
            rates = tc.Rates?.Select(r => new
            {
                r.Id,
                r.TaxCategoryId,
                rate = ToDecimalRate(r.RatePercent),
                r.EffectiveFrom,
                r.EffectiveTo,
                r.IsActive
            })
        });
        return Ok(new { data });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> Get(int id)
    {
        var category = await _taxService.GetCategoryAsync(id);
        if (category == null) return NotFound();
        return Ok(new
        {
            data = new
            {
                category.Id,
                category.MerchantId,
                category.Name,
                category.IsActive,
                rates = category.Rates?.Select(r => new
                {
                    r.Id,
                    r.TaxCategoryId,
                    rate = ToDecimalRate(r.RatePercent),
                    r.EffectiveFrom,
                    r.EffectiveTo,
                    r.IsActive
                })
            }
        });
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<object>> Create([FromHeader(Name = "X-Merchant-Id")] string? merchantId, [FromBody] TaxCategoryCreateRequest request)
    {
        var mId = int.TryParse(merchantId, out var parsed) ? parsed : 1;
        var created = await _taxService.CreateCategoryAsync(mId, new TaxCategoryDto(0, mId, request.Name, new List<TaxRateDto>(), true));
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new
        {
            data = new
            {
                created.Id,
                created.MerchantId,
                created.Name,
                created.IsActive,
                rates = created.Rates?.Select(r => new
                {
                    r.Id,
                    r.TaxCategoryId,
                    rate = ToDecimalRate(r.RatePercent),
                    r.EffectiveFrom,
                    r.EffectiveTo,
                    r.IsActive
                })
            }
        });
    }

    [HttpPatch("{id:int}")]
    [Authorize]
    public async Task<ActionResult<object>> Update(int id, [FromBody] TaxCategoryUpdateRequest request)
    {
        var updated = await _taxService.UpdateCategoryAsync(id, new TaxCategoryDto(id, 0, request.Name, null, true));
        if (updated == null) return NotFound();
        return Ok(new
        {
            data = new
            {
                updated.Id,
                updated.MerchantId,
                updated.Name,
                updated.IsActive,
                rates = updated.Rates?.Select(r => new
                {
                    r.Id,
                    r.TaxCategoryId,
                    rate = ToDecimalRate(r.RatePercent),
                    r.EffectiveFrom,
                    r.EffectiveTo,
                    r.IsActive
                })
            }
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _taxService.DeleteCategoryAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/restore")]
    [Authorize]
    public async Task<IActionResult> Restore(int id)
    {
        var restored = await _taxService.RestoreCategoryAsync(id);
        return restored ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/rates")]
    [Authorize]
    public async Task<ActionResult<object>> AddRate(int id, [FromBody] CategoryRateCreateRequest request)
    {
        try
        {
            var dto = new TaxRateDto(0, id, ToPercent(request.Rate), request.EffectiveFrom, request.EffectiveTo);
            var rate = await _taxService.AddRateAsync(id, dto);
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public record TaxCategoryCreateRequest(string Name);
    public record TaxCategoryUpdateRequest(string Name);
    public record CategoryRateCreateRequest(decimal Rate, DateTime EffectiveFrom, DateTime? EffectiveTo);
}
