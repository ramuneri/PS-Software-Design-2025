using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class MerchantService(ApplicationDbContext db) : IMerchantService
{
    public async Task<IEnumerable<MerchantDto>> GetAllAsync(bool includeInactive, bool isSuperAdmin, int? currentMerchantId)
    {
        IQueryable<Merchant> query = db.Merchants;

        if (!isSuperAdmin)
        {
            if (currentMerchantId.HasValue)
            {
                query = query.Where(m => m.MerchantId == currentMerchantId.Value);
            }
            else
            {
                // No merchant scope, nothing to return
                return Enumerable.Empty<MerchantDto>();
            }
        }

        if (!includeInactive)
        {
            query = query.Where(m => m.IsActive);
        }

        var merchants = await query.OrderBy(m => m.MerchantId).ToListAsync();
        return merchants.Select(ToDto);
    }

    public async Task<MerchantDto?> GetByIdAsync(int merchantId, bool isSuperAdmin, int? currentMerchantId)
    {
        if (!isSuperAdmin && currentMerchantId.HasValue && merchantId != currentMerchantId.Value)
        {
            return null;
        }

        var merchant = await db.Merchants.FindAsync(merchantId);
        return merchant == null ? null : ToDto(merchant);
    }

    public async Task<MerchantDto> CreateAsync(MerchantCreateDto dto, string currentUserId, bool isSuperAdmin)
    {
        if (!isSuperAdmin)
        {
            throw new UnauthorizedAccessException("Only SuperAdmin can create merchants.");
        }

        var merchant = new Merchant
        {
            Name = dto.Name.Trim(),
            BusinessType = dto.BusinessType?.Trim(),
            Country = dto.Country?.Trim(),
            Address = dto.Address?.Trim(),
            City = dto.City?.Trim(),
            Phone = dto.Phone?.Trim(),
            Email = dto.Email?.Trim(),
            PaymentProvider = dto.PaymentProvider?.Trim(),
            PaymentConfig = dto.PaymentConfig,
            OwnerId = dto.OwnerId?.Trim(),
            IsActive = true
        };

        db.Merchants.Add(merchant);
        await db.SaveChangesAsync();

        return ToDto(merchant);
    }

    public async Task<MerchantDto?> UpdateAsync(int merchantId, MerchantUpdateDto dto, bool isSuperAdmin, string currentUserId)
    {
        var merchant = await db.Merchants.FindAsync(merchantId);
        if (merchant == null) return null;

        if (!isSuperAdmin && merchant.OwnerId != currentUserId)
        {
            throw new UnauthorizedAccessException("Only owner or SuperAdmin can update merchant profile.");
        }

        if (dto.OwnerId != null && dto.OwnerId != merchant.OwnerId && !isSuperAdmin)
        {
            throw new UnauthorizedAccessException("Only SuperAdmin can change owner.");
        }

        if (dto.Name != null) merchant.Name = dto.Name.Trim();
        if (dto.BusinessType != null) merchant.BusinessType = dto.BusinessType.Trim();
        if (dto.Country != null) merchant.Country = dto.Country.Trim();
        if (dto.Address != null) merchant.Address = dto.Address.Trim();
        if (dto.City != null) merchant.City = dto.City.Trim();
        if (dto.Phone != null) merchant.Phone = dto.Phone.Trim();
        if (dto.Email != null) merchant.Email = dto.Email.Trim();
        if (dto.PaymentProvider != null) merchant.PaymentProvider = dto.PaymentProvider.Trim();
        if (dto.PaymentConfig != null) merchant.PaymentConfig = dto.PaymentConfig;
        if (isSuperAdmin && dto.OwnerId != null) merchant.OwnerId = dto.OwnerId.Trim();

        await db.SaveChangesAsync();
        return ToDto(merchant);
    }

    public async Task<bool> DeleteAsync(int merchantId, bool isSuperAdmin, string currentUserId, int? currentMerchantId)
    {
        var merchant = await db.Merchants.FindAsync(merchantId);
        if (merchant == null) return false;

        if (!isSuperAdmin && merchant.OwnerId != currentUserId)
        {
            return false;
        }

        merchant.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int merchantId, bool isSuperAdmin, string currentUserId, int? currentMerchantId)
    {
        var merchant = await db.Merchants.FindAsync(merchantId);
        if (merchant == null) return false;

        if (!isSuperAdmin && merchant.OwnerId != currentUserId)
        {
            return false;
        }

        merchant.IsActive = true;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<MerchantSubscriptionDto>> GetSubscriptionsAsync(int merchantId, bool isSuperAdmin, int? currentMerchantId)
    {
        if (!isSuperAdmin && currentMerchantId.HasValue && merchantId != currentMerchantId.Value)
        {
            return Enumerable.Empty<MerchantSubscriptionDto>();
        }

        var subs = await db.MerchantSubscriptions
            .Include(ms => ms.Plan)
            .Where(ms => ms.MerchantId == merchantId)
            .OrderByDescending(ms => ms.StartsAt)
            .ToListAsync();

        return subs.Select(ToDto);
    }

    public async Task<MerchantSubscriptionDto?> CreateSubscriptionAsync(int merchantId, MerchantSubscriptionCreateDto dto, bool isSuperAdmin, int? currentMerchantId)
    {
        if (!isSuperAdmin && (!currentMerchantId.HasValue || merchantId != currentMerchantId.Value))
        {
            throw new UnauthorizedAccessException("Not allowed to modify subscriptions for this merchant.");
        }

        var merchant = await db.Merchants.FindAsync(merchantId);
        if (merchant == null || !merchant.IsActive) return null;

        var plan = await db.Plans.FindAsync(dto.PlanId);
        if (plan == null || !plan.IsActive) return null;

        var subscription = new MerchantSubscription
        {
            MerchantId = merchantId,
            PlanId = dto.PlanId,
            StartsAt = dto.StartsAt,
            IsActive = true,
            Status = "Active"
        };

        db.MerchantSubscriptions.Add(subscription);
        await db.SaveChangesAsync();

        subscription.Plan = plan;

        return ToDto(subscription);
    }

    public async Task<bool> DeactivateSubscriptionAsync(int merchantId, int subscriptionId, bool isSuperAdmin, int? currentMerchantId)
    {
        if (!isSuperAdmin && (!currentMerchantId.HasValue || merchantId != currentMerchantId.Value))
        {
            return false;
        }

        var sub = await db.MerchantSubscriptions.FirstOrDefaultAsync(s => s.Id == subscriptionId && s.MerchantId == merchantId);
        if (sub == null) return false;

        sub.IsActive = false;
        sub.Status = "Cancelled";
        if (sub.EndsAt == null)
        {
            sub.EndsAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return true;
    }

    private static MerchantDto ToDto(Merchant m) =>
        new(
            m.MerchantId,
            m.OwnerId,
            m.Name ?? string.Empty,
            m.BusinessType,
            m.Country ?? string.Empty,
            m.Address,
            m.City,
            m.Phone,
            m.Email ?? string.Empty,
            m.PaymentProvider,
            m.PaymentConfig,
            m.IsActive
        );

    private static MerchantSubscriptionDto ToDto(MerchantSubscription s) =>
        new(
            s.Id,
            s.MerchantId,
            s.PlanId,
            s.StartsAt,
            s.EndsAt,
            s.Status,
            s.IsActive,
            s.Plan?.Name
        );
}
