using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class DiscountService : IDiscountService
{
    private readonly ApplicationDbContext _db;

    public DiscountService(ApplicationDbContext db)
    {
        _db = db;
    }


    public async Task<DiscountDto> CreateAsync(CreateDiscountDto dto)
    {
        ValidateCreate(dto);

        var discount = new Discount
        {
            ProductId = dto.ProductId,
            ServiceId = dto.ServiceId,
            Name = dto.Name,
            Code = dto.Code,
            Scope = dto.Scope,
            Type = dto.Type,
            Value = dto.Value,
            StartsAt = dto.StartsAt?.ToUniversalTime(),
            EndsAt = dto.EndsAt?.ToUniversalTime(),

            IsActive = true
        };

        _db.Discounts.Add(discount);
        await _db.SaveChangesAsync();
        return ToDto(discount);
    }


    public async Task<IEnumerable<DiscountDto>> GetAllAsync(bool includeInactive = false)
    {
        var query = _db.Discounts.AsQueryable();
        if (!includeInactive)
            query = query.Where(d => d.IsActive);
        return await query
        .Select(discount => ToDto(discount))
        .ToListAsync();
    }


    public async Task<DiscountDto?> GetByIdAsync(int id)
    {
        var discount = await _db.Discounts.FindAsync(id);
        if (discount == null || !discount.IsActive)
            return null;

        return ToDto(discount);
    }


    public async Task<DiscountDto?> UpdateAsync(int id, UpdateDiscountDto dto)
    {
        var discount = await _db.Discounts.FindAsync(id);
        if (discount == null)
            return null;

        ApplyUpdate(discount, dto);
        ValidateCommon(discount);

        await _db.SaveChangesAsync();
        return ToDto(discount);
    }


    public async Task<bool> DeleteAsync(int id)
    {
        var d = await _db.Discounts.FindAsync(id);
        if (d == null)
            return false;

        d.IsActive = false;
        await _db.SaveChangesAsync();
        return true;
    }

 
    public async Task<bool> RestoreAsync(int id)
    {
        var discount = await _db.Discounts.FindAsync(id);
        if (discount == null)
            return false;

        discount.IsActive = true;
        await _db.SaveChangesAsync();
        return true;
    }

    private void ValidateCreate(CreateDiscountDto dto)
    {
        if (dto.StartsAt != null && dto.EndsAt != null && dto.StartsAt > dto.EndsAt)
            throw new Exception("startsAt must be earlier than endsAt.");

        if (dto.ProductId != null && dto.ServiceId != null)
            throw new Exception("Discount cannot apply to both a product and a service.");

        if (dto.ProductId == null && dto.ServiceId == null)
            throw new Exception("Discount must apply to a product or service.");
    }

    private void ValidateCommon(Discount discount)
    {
        if (discount.StartsAt != null && discount.EndsAt != null && discount.StartsAt > discount.EndsAt)
            throw new Exception("startsAt must be earlier than endsAt.");

        if (discount.ProductId != null && discount.ServiceId != null)
            throw new Exception("Discount cannot apply to both product and service.");
    }

    private void ApplyUpdate(Discount discount, UpdateDiscountDto dto)
    {
        if (dto.ProductId != null) discount.ProductId = dto.ProductId;
        if (dto.ServiceId != null) discount.ServiceId = dto.ServiceId;
        if (dto.Name != null) discount.Name = dto.Name;
        if (dto.Code != null) discount.Code = dto.Code;
        if (dto.Scope != null) discount.Scope = dto.Scope;
        if (dto.Type != null) discount.Type = dto.Type;
        if (dto.Value != null) discount.Value = dto.Value;

        if (dto.StartsAt != null)
            discount.StartsAt = dto.StartsAt.Value.ToUniversalTime();

        if (dto.EndsAt != null)
            discount.EndsAt = dto.EndsAt.Value.ToUniversalTime();

        if (dto.IsActive != null)
            discount.IsActive = dto.IsActive.Value;
    }

    private static DiscountDto ToDto(Discount discount) =>
        new DiscountDto(
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
        );
}
