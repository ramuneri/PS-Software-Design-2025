using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class TaxService : ITaxService
{
    private readonly ApplicationDbContext _db;

    public TaxService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TaxCategoryDto>> GetCategoriesAsync(bool includeInactive = false)
    {
        var categoriesQuery = _db.TaxCategories
            .Include(tc => tc.TaxRates)
            .AsQueryable();

        if (!includeInactive)
        {
            categoriesQuery = categoriesQuery.Where(tc => tc.IsActive);
        }

        var categories = await categoriesQuery.ToListAsync();

        return categories.Select(tc => ToDto(tc, includeInactive));
    }

    public async Task<TaxCategoryDto?> GetCategoryAsync(int id, bool includeInactive = false)
    {
        var query = _db.TaxCategories
            .Include(tc => tc.TaxRates)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(tc => tc.IsActive);
        }

        var entity = await query.FirstOrDefaultAsync(tc => tc.Id == id);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<TaxCategoryDto> CreateCategoryAsync(int merchantId, TaxCategoryDto dto)
    {
        var entity = new TaxCategories
        {
            MerchantId = merchantId,
            Name = dto.Name ?? "Tax",
            IsActive = true
        };

        _db.TaxCategories.Add(entity);
        await _db.SaveChangesAsync();

        return ToDto(entity);
    }

    public async Task<TaxCategoryDto?> UpdateCategoryAsync(int id, TaxCategoryDto dto)
    {
        var entity = await _db.TaxCategories.Include(tc => tc.TaxRates).FirstOrDefaultAsync(tc => tc.Id == id);
        if (entity == null || !entity.IsActive) return null;

        if (!string.IsNullOrWhiteSpace(dto.Name))
            entity.Name = dto.Name!;

        await _db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var entity = await _db.TaxCategories.Include(tc => tc.TaxRates).FirstOrDefaultAsync(tc => tc.Id == id);
        if (entity == null) return false;

        if (!entity.IsActive)
            return true;

        entity.IsActive = false;
        entity.DeletedAt = DateTime.UtcNow;
        foreach (var rate in entity.TaxRates.Where(r => r.IsActive))
        {
            rate.IsActive = false;
            rate.DeletedAt = entity.DeletedAt;
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreCategoryAsync(int id)
    {
        var entity = await _db.TaxCategories.Include(tc => tc.TaxRates).FirstOrDefaultAsync(tc => tc.Id == id);
        if (entity == null) return false;

        if (entity.IsActive)
            return true;

        entity.IsActive = true;
        entity.DeletedAt = null;
        foreach (var rate in entity.TaxRates.Where(r => !r.IsActive))
        {
            rate.IsActive = true;
            rate.DeletedAt = null;
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<TaxRateDto?> AddRateAsync(int categoryId, TaxRateDto dto)
    {
        var entity = await _db.TaxCategories.Include(tc => tc.TaxRates).FirstOrDefaultAsync(tc => tc.Id == categoryId);
        if (entity == null || !entity.IsActive) return null;

        var overlaps = entity.TaxRates.Where(r => r.IsActive).Any(r =>
            (dto.EffectiveTo == null || r.EffectiveFrom <= dto.EffectiveTo) &&
            (r.EffectiveTo == null || dto.EffectiveFrom <= r.EffectiveTo));
        if (overlaps)
            throw new InvalidOperationException("Overlapping tax rate periods.");

        var rate = new TaxRate
        {
            TaxCategoryId = categoryId,
            RatePercent = dto.RatePercent,
            EffectiveFrom = dto.EffectiveFrom,
            EffectiveTo = dto.EffectiveTo,
            IsActive = true
        };

        _db.TaxRates.Add(rate);
        await _db.SaveChangesAsync();

        return new TaxRateDto(rate.Id, rate.TaxCategoryId, rate.RatePercent, rate.EffectiveFrom, rate.EffectiveTo, rate.IsActive);
    }

    public async Task<IEnumerable<TaxRateDto>> GetRatesAsync(int? taxCategoryId, DateTime? asOf, bool includeInactive = false)
    {
        var query = _db.TaxRates.AsQueryable();

        if (!includeInactive)
            query = query.Where(r => r.IsActive);

        if (taxCategoryId.HasValue)
            query = query.Where(r => r.TaxCategoryId == taxCategoryId.Value);

        if (asOf.HasValue)
            query = query.Where(r => r.EffectiveFrom <= asOf.Value && (r.EffectiveTo == null || r.EffectiveTo > asOf.Value));

        var rates = await query.ToListAsync();
        return rates.Select(r => new TaxRateDto(r.Id, r.TaxCategoryId, r.RatePercent, r.EffectiveFrom, r.EffectiveTo, r.IsActive));
    }

    public async Task<TaxRateDto?> GetRateAsync(int id, bool includeInactive = false)
    {
        var query = _db.TaxRates.AsQueryable();
        if (!includeInactive)
            query = query.Where(r => r.IsActive);

        var rate = await query.FirstOrDefaultAsync(r => r.Id == id);
        return rate == null ? null : new TaxRateDto(rate.Id, rate.TaxCategoryId, rate.RatePercent, rate.EffectiveFrom, rate.EffectiveTo, rate.IsActive);
    }

    public async Task<TaxRateDto?> UpdateRateAsync(int id, TaxRateDto dto)
    {
        var rate = await _db.TaxRates.FindAsync(id);
        if (rate == null || !rate.IsActive) return null;

        rate.RatePercent = dto.RatePercent;
        if (dto.EffectiveFrom != default) rate.EffectiveFrom = dto.EffectiveFrom;
        rate.EffectiveTo = dto.EffectiveTo;

        await _db.SaveChangesAsync();
        return new TaxRateDto(rate.Id, rate.TaxCategoryId, rate.RatePercent, rate.EffectiveFrom, rate.EffectiveTo, rate.IsActive);
    }

    public async Task<bool> DeleteRateAsync(int id)
    {
        var rate = await _db.TaxRates.FindAsync(id);
        if (rate == null) return false;

        if (!rate.IsActive)
            return true;

        rate.IsActive = false;
        rate.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreRateAsync(int id)
    {
        var rate = await _db.TaxRates.FindAsync(id);
        if (rate == null) return false;

        if (rate.IsActive)
            return true;

        rate.IsActive = true;
        rate.DeletedAt = null;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> GetRatePercentAtAsync(int taxCategoryId, DateTime atUtc)
    {
        var rate = await _db.TaxRates
            .Where(r => r.TaxCategoryId == taxCategoryId
                        && r.EffectiveFrom <= atUtc
                        && (r.EffectiveTo == null || r.EffectiveTo > atUtc))
            .OrderByDescending(r => r.EffectiveFrom)
            .FirstOrDefaultAsync();

        return rate?.RatePercent ?? 0m;
    }

    private static TaxCategoryDto ToDto(TaxCategories tc, bool includeInactive = false) =>
        new(tc.Id, tc.MerchantId, tc.Name, tc.TaxRates
            .Where(r => includeInactive || r.IsActive)
            .OrderByDescending(r => r.EffectiveFrom)
            .Select(r => new TaxRateDto(r.Id, r.TaxCategoryId, r.RatePercent, r.EffectiveFrom, r.EffectiveTo, r.IsActive))
            .ToList(), tc.IsActive);
}
