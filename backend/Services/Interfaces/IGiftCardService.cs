using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IGiftCardService
{
    Task<IEnumerable<GiftcardDto>> GetAllAsync(int merchantId, bool includeInactive = false, int limit = 10, int offset = 0);
    Task<GiftcardDto?> GetByIdAsync(int id);
    Task<GiftcardDto?> GetByCodeAsync(string code);
    Task<GiftcardDto> CreateAsync(int merchantId, GiftcardCreateDto dto);
    Task<GiftcardDto?> UpdateAsync(int id, GiftcardUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> RestoreAsync(int id);
    Task<bool> DeductBalanceAsync(int giftcardId, decimal amount);
}
