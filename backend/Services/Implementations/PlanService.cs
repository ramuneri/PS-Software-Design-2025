using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class PlanService(ApplicationDbContext db) : IPlanService
{
    public async Task<IEnumerable<PlanDto>> GetPlansAsync(bool includeInactive)
    {
        var query = db.Plans.Include(p => p.PlanFeatures).ThenInclude(pf => pf.Feature).AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        var items = await query.OrderBy(p => p.Id).ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<PlanDto?> GetPlanAsync(int id)
    {
        var plan = await db.Plans
            .Include(p => p.PlanFeatures)
            .ThenInclude(pf => pf.Feature)
            .FirstOrDefaultAsync(p => p.Id == id);
        return plan == null ? null : ToDto(plan);
    }

    public async Task<PlanDto> CreatePlanAsync(PlanCreateDto dto)
    {
        var plan = new Plan
        {
            Name = dto.Name,
            Price = dto.Price,
            BillingPeriod = dto.BillingPeriod,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        db.Plans.Add(plan);
        await db.SaveChangesAsync();

        if (dto.Features != null && dto.Features.Count > 0)
        {
            await SetPlanFeatures(plan.Id, dto.Features);
        }

        await db.Entry(plan).Collection(p => p.PlanFeatures).Query().Include(pf => pf.Feature).LoadAsync();
        return ToDto(plan);
    }

    public async Task<PlanDto?> UpdatePlanAsync(int id, PlanUpdateDto dto)
    {
        var plan = await db.Plans.Include(p => p.PlanFeatures).ThenInclude(pf => pf.Feature).FirstOrDefaultAsync(p => p.Id == id);
        if (plan == null) return null;

        if (dto.Name != null) plan.Name = dto.Name;
        if (dto.Price.HasValue) plan.Price = dto.Price.Value;
        if (dto.BillingPeriod != null) plan.BillingPeriod = dto.BillingPeriod;
        if (dto.IsActive.HasValue) plan.IsActive = dto.IsActive.Value;

        await db.SaveChangesAsync();

        if (dto.Features != null)
        {
            await SetPlanFeatures(plan.Id, dto.Features);
            await db.Entry(plan).Collection(p => p.PlanFeatures).Query().Include(pf => pf.Feature).LoadAsync();
        }

        return ToDto(plan);
    }

    public async Task<bool> DeletePlanAsync(int id)
    {
        var plan = await db.Plans.FindAsync(id);
        if (plan == null) return false;
        plan.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestorePlanAsync(int id)
    {
        var plan = await db.Plans.FindAsync(id);
        if (plan == null) return false;
        plan.IsActive = true;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<FeatureDto>> GetFeaturesAsync(bool includeInactive)
    {
        var query = db.Features.AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(f => f.IsActive);
        }

        var items = await query.OrderBy(f => f.Id).ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<FeatureDto?> GetFeatureAsync(int id)
    {
        var feature = await db.Features.FindAsync(id);
        return feature == null ? null : ToDto(feature);
    }

    public async Task<FeatureDto> CreateFeatureAsync(FeatureCreateDto dto)
    {
        var feature = new Feature
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            IsActive = true
        };
        db.Features.Add(feature);
        await db.SaveChangesAsync();
        return ToDto(feature);
    }

    public async Task<FeatureDto?> UpdateFeatureAsync(int id, FeatureUpdateDto dto)
    {
        var feature = await db.Features.FindAsync(id);
        if (feature == null) return null;

        if (dto.Name != null) feature.Name = dto.Name.Trim();
        if (dto.Description != null) feature.Description = dto.Description.Trim();
        if (dto.IsActive.HasValue) feature.IsActive = dto.IsActive.Value;

        await db.SaveChangesAsync();
        return ToDto(feature);
    }

    public async Task<bool> DeleteFeatureAsync(int id)
    {
        var feature = await db.Features.FindAsync(id);
        if (feature == null) return false;
        feature.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreFeatureAsync(int id)
    {
        var feature = await db.Features.FindAsync(id);
        if (feature == null) return false;
        feature.IsActive = true;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MerchantHasFeatureAsync(int merchantId, string featureName, DateTime? asOf = null)
    {
        var now = asOf ?? DateTime.UtcNow;
        var name = featureName.Trim().ToLowerInvariant();

        var subscription = await db.MerchantSubscriptions
            .Include(ms => ms.Plan)
            .ThenInclude(p => p.PlanFeatures)
            .ThenInclude(pf => pf.Feature)
            .Where(ms => ms.MerchantId == merchantId
                         && ms.IsActive
                         && ms.StartsAt <= now
                         && (ms.EndsAt == null || ms.EndsAt > now))
            .OrderByDescending(ms => ms.StartsAt)
            .FirstOrDefaultAsync();

        if (subscription == null || subscription.Plan == null) return false;

        return subscription.Plan.PlanFeatures.Any(pf =>
            pf.Feature != null &&
            pf.Feature.IsActive &&
            !string.IsNullOrWhiteSpace(pf.Feature.Name) &&
            pf.Feature.Name.Trim().ToLowerInvariant() == name);
    }

    private async Task SetPlanFeatures(int planId, List<PlanFeatureRequestDto> features)
    {
        var plan = await db.Plans.Include(p => p.PlanFeatures).FirstAsync(p => p.Id == planId);

        db.PlanFeatures.RemoveRange(plan.PlanFeatures);

        var featureIds = features.Select(f => f.FeatureId).ToList();
        var featureEntities = await db.Features.Where(f => featureIds.Contains(f.Id) && f.IsActive).ToListAsync();
        var featureLookup = featureEntities.ToDictionary(f => f.Id, f => f);

        var newLinks = features
            .Where(f => featureLookup.ContainsKey(f.FeatureId))
            .Select(f => new PlanFeature
            {
                PlanId = planId,
                FeatureId = f.FeatureId,
                LocationLimit = f.LocationLimit
            });

        await db.PlanFeatures.AddRangeAsync(newLinks);
        await db.SaveChangesAsync();
    }

    private static PlanDto ToDto(Plan p) =>
        new(
            p.Id,
            p.Name,
            p.Price,
            p.BillingPeriod,
            p.IsActive,
            p.CreatedAt,
            p.PlanFeatures?
                .Select(pf => new PlanFeatureDto(
                    pf.UniqueId,
                    pf.PlanId,
                    pf.FeatureId,
                    pf.LocationLimit,
                    pf.Feature?.Name,
                    pf.Feature?.Description
                )).ToList()
        );

    private static FeatureDto ToDto(Feature f) =>
        new(f.Id, f.Name ?? string.Empty, f.Description, f.IsActive);
}
