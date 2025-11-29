using backend.Data;
using backend.Dtos;
using backend.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscountsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DiscountsController(ApplicationDbContext db)
    {
        _db = db;
    }

    public record CreateDiscountRequest(
        int? ProductId,
        int? ServiceId,
        string Name,
        string? Code,
        string Scope,
        string Type,
        decimal? Value,
        DateTime? StartsAt,
        DateTime? EndsAt
    );

    public record UpdateDiscountRequest(
        int? ProductId,
        int? ServiceId,
        string? Name,
        string? Code,
        string? Scope,
        string? Type,
        decimal? Value,
        DateTime? StartsAt,
        DateTime? EndsAt,
        bool? IsActive
    );


    [HttpGet]
    public async Task<ActionResult<IEnumerable<DiscountDto>>> GetDiscounts()
    {
        var discounts = await _db.Discounts
            .Where(discounts => discounts.IsActive)
            .Select(discount => new DiscountDto(
                discount.Id,
                discount.ProductId,
                discount.ServiceId,
                discount.Name,
                discount.Code,
                discount.Scope,
                discount.Type,
                discount.Value,
                discount.StartsAt,
                discount.EndsAt,
                discount.IsActive
            ))
            .ToListAsync();

        return Ok(discounts);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DiscountDto>> GetDiscount(int id)
    {
        var discount = await _db.Discounts.FindAsync(id);

        if (discount == null)
            return NotFound();

        return Ok(new DiscountDto(
            discount.Id,
            discount.ProductId,
            discount.ServiceId,
            discount.Name,
            discount.Code,
            discount.Scope,
            discount.Type,
            discount.Value,
            discount.StartsAt,
            discount.EndsAt,
            discount.IsActive
        ));
    }

    [HttpPost]
    public async Task<ActionResult<DiscountDto>> CreateDiscount(CreateDiscountRequest dto)
    {
        if (dto.StartsAt != null && dto.EndsAt != null && dto.StartsAt > dto.EndsAt)
            return BadRequest("startsAt must be earlier than endsAt.");

        if (dto.ProductId != null && dto.ServiceId != null)
            return BadRequest("Discount cannot target both product and service.");

        if (dto.ProductId == null && dto.ServiceId == null)
            return BadRequest("Discount must target either a product or a service.");

        var discount = new Discount
        {
            ProductId = dto.ProductId,
            ServiceId = dto.ServiceId,
            Name = dto.Name,
            Code = dto.Code,
            Scope = dto.Scope,
            Type = dto.Type,
            Value = dto.Value,
            StartsAt = dto.StartsAt,
            EndsAt = dto.EndsAt,
            IsActive = true
        };

        _db.Discounts.Add(discount);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDiscount), new { id = discount.Id }, new DiscountDto(
            discount.Id,
            discount.ProductId,
            discount.ServiceId,
            discount.Name,
            discount.Code,
            discount.Scope,
            discount.Type,
            discount.Value,
            discount.StartsAt,
            discount.EndsAt,
            discount.IsActive
        ));
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult> UpdateDiscount(int id, UpdateDiscountRequest dto)
    {
        var d = await _db.Discounts.FindAsync(id);

        if (d == null)
            return NotFound();

        if (dto.ProductId.HasValue)
            d.ProductId = dto.ProductId;
        if (dto.ServiceId.HasValue)
            d.ServiceId = dto.ServiceId;
        if (dto.Name != null)
            d.Name = dto.Name;
        if (dto.Code != null)
            d.Code = dto.Code;
        if (dto.Scope != null)
            d.Scope = dto.Scope;
        if (dto.Type != null)
            d.Type = dto.Type;
        if (dto.Value.HasValue)
            d.Value = dto.Value;
        if (dto.StartsAt.HasValue)
            d.StartsAt = dto.StartsAt;
        if (dto.EndsAt.HasValue)
            d.EndsAt = dto.EndsAt;
        if (dto.IsActive.HasValue)
            d.IsActive = dto.IsActive.Value;

        if (d.StartsAt != null && d.EndsAt != null && d.StartsAt > d.EndsAt)
            return BadRequest("startsAt must be earlier than endsAt.");

        if (d.ProductId != null && d.ServiceId != null)
            return BadRequest("Discount cannot target both product and service.");

        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteDiscount(int id)
    {
        var d = await _db.Discounts.FindAsync(id);

        if (d == null)
            return NotFound();

        d.IsActive = false; // KEEP historical orders intact
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
