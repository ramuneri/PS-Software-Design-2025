using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class GiftCardService : IGiftCardService
{
    private readonly ApplicationDbContext context;

    public GiftCardService(ApplicationDbContext context)
    {
        this.context = context;
    }

    public async Task<IEnumerable<GiftcardDto>> GetAllAsync(int merchantId, bool includeInactive = false, int limit = 10, int offset = 0)
    {
        var query = context.Giftcards
            .AsNoTracking()
            .Where(g => g.MerchantId == merchantId);

        if (!includeInactive)
        {
            query = query.Where(g => g.IsActive && g.DeletedAt == null);
        }

        var giftcards = await query
            .OrderByDescending(g => g.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();

        return giftcards.Select(MapToDto);
    }

    public async Task<GiftcardDto?> GetByIdAsync(int id)
    {
        var giftcard = await context.Giftcards
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.GiftcardId == id && g.IsActive && g.DeletedAt == null);

        return giftcard == null ? null : MapToDto(giftcard);
    }

    public async Task<GiftcardDto?> GetByCodeAsync(string code)
    {
        var giftcard = await context.Giftcards
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Code == code && g.IsActive && g.DeletedAt == null);

        return giftcard == null ? null : MapToDto(giftcard);
    }

    public async Task<GiftcardDto> CreateAsync(int merchantId, GiftcardCreateDto dto)
    {
        var code = dto.Code ?? await GenerateUniqueCodeAsync(merchantId);

        var giftcard = new Giftcard
        {
            MerchantId = merchantId,
            Code = code,
            InitialBalance = dto.InitialBalance,
            Balance = dto.InitialBalance,
            IssuedAt = DateTime.UtcNow,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Giftcards.Add(giftcard);
        await context.SaveChangesAsync();

        return MapToDto(giftcard);
    }

    public async Task<GiftcardDto?> UpdateAsync(int id, GiftcardUpdateDto dto)
    {
        var giftcard = await context.Giftcards
            .FirstOrDefaultAsync(g => g.GiftcardId == id);

        if (giftcard == null)
            return null;

        if (dto.IsActive.HasValue)
        {
            if (!dto.IsActive.Value && giftcard.IsActive)
            {
                giftcard.IsActive = false;
                giftcard.DeletedAt = DateTime.UtcNow;
            }
            else if (dto.IsActive.Value && !giftcard.IsActive)
            {
                giftcard.IsActive = true;
                giftcard.DeletedAt = null;
            }
        }

        giftcard.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return MapToDto(giftcard);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var giftcard = await context.Giftcards
            .FirstOrDefaultAsync(g => g.GiftcardId == id);

        if (giftcard == null)
            return false;

        if (!giftcard.IsActive)
            return true;

        giftcard.IsActive = false;
        giftcard.DeletedAt = DateTime.UtcNow;
        giftcard.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var giftcard = await context.Giftcards
            .FirstOrDefaultAsync(g => g.GiftcardId == id && !g.IsActive);

        if (giftcard == null)
            return false;

        giftcard.IsActive = true;
        giftcard.DeletedAt = null;
        giftcard.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeductBalanceAsync(int giftcardId, decimal amount)
    {
        var giftcard = await context.Giftcards
            .FirstOrDefaultAsync(g => g.GiftcardId == giftcardId && g.IsActive && g.DeletedAt == null);

        if (giftcard == null || giftcard.Balance < amount)
            return false;

        giftcard.Balance -= amount;
        giftcard.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return true;
    }

    private async Task<string> GenerateUniqueCodeAsync(int merchantId)
    {
        string code;
        bool isUnique = false;

        do
        {
            code = GenerateRandomCode();
            isUnique = !await context.Giftcards
                .AnyAsync(g => g.Code == code && g.MerchantId == merchantId);
        } while (!isUnique);

        return code;
    }

    private string GenerateRandomCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 12)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
    }

    private GiftcardDto MapToDto(Giftcard giftcard)
    {
        return new GiftcardDto(
            giftcard.GiftcardId,
            giftcard.MerchantId,
            giftcard.Code,
            giftcard.InitialBalance,
            giftcard.Balance,
            giftcard.IssuedAt,
            giftcard.ExpiresAt,
            giftcard.IsActive,
            giftcard.DeletedAt,
            giftcard.CreatedAt,
            giftcard.UpdatedAt
        );
    }
}
