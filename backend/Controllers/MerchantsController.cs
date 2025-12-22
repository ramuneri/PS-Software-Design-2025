using System.Security.Claims;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MerchantsController(IMerchantService service) : ControllerBase
{
    private bool IsSuperAdmin => bool.TryParse(User.FindFirstValue("isSuperAdmin"), out var val) && val;
    private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private int? CurrentMerchantId
    {
        get
        {
            var merchantClaim = User.FindFirstValue("merchantId");
            return int.TryParse(merchantClaim, out var id) ? id : null;
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var data = await service.GetAllAsync(includeInactive, IsSuperAdmin, CurrentMerchantId);
        return Ok(new { data });
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Get(int id)
    {
        var merchant = await service.GetByIdAsync(id, IsSuperAdmin, CurrentMerchantId);
        return merchant == null ? NotFound() : Ok(new { data = merchant });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(MerchantCreateDto dto)
    {
        if (!IsSuperAdmin)
        {
            return Forbid();
        }

        var created = await service.CreateAsync(dto, CurrentUserId ?? string.Empty, IsSuperAdmin);
        return CreatedAtAction(nameof(Get), new { id = created.MerchantId }, new { data = created });
    }

    [HttpPatch("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, MerchantUpdateDto dto)
    {
        try
        {
            var updated = await service.UpdateAsync(id, dto, IsSuperAdmin, CurrentUserId ?? string.Empty);
            return updated == null ? NotFound() : Ok(new { data = updated });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await service.DeleteAsync(id, IsSuperAdmin, CurrentUserId ?? string.Empty, CurrentMerchantId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/restore")]
    [Authorize]
    public async Task<IActionResult> Restore(int id)
    {
        var ok = await service.RestoreAsync(id, IsSuperAdmin, CurrentUserId ?? string.Empty, CurrentMerchantId);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("{merchantId:int}/subscriptions")]
    [Authorize]
    public async Task<IActionResult> GetSubscriptions(int merchantId)
    {
        var data = await service.GetSubscriptionsAsync(merchantId, IsSuperAdmin, CurrentMerchantId);
        return Ok(new { data });
    }

    [HttpPost("{merchantId:int}/subscriptions")]
    [Authorize]
    public async Task<IActionResult> CreateSubscription(int merchantId, MerchantSubscriptionCreateDto dto)
    {
        try
        {
            var created = await service.CreateSubscriptionAsync(merchantId, dto, IsSuperAdmin, CurrentMerchantId);
            return created == null
                ? NotFound()
                : CreatedAtAction(nameof(GetSubscriptions), new { merchantId }, new { data = created });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{merchantId:int}/subscriptions/{subscriptionId:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteSubscription(int merchantId, int subscriptionId)
    {
        var ok = await service.DeactivateSubscriptionAsync(merchantId, subscriptionId, IsSuperAdmin, CurrentMerchantId);
        return ok ? NoContent() : NotFound();
    }
}
