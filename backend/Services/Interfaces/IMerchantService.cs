using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IMerchantService
{
    Task<IEnumerable<MerchantDto>> GetAllAsync(bool includeInactive, bool isSuperAdmin, int? currentMerchantId);
    Task<MerchantDto?> GetByIdAsync(int merchantId, bool isSuperAdmin, int? currentMerchantId);
    Task<MerchantDto> CreateAsync(MerchantCreateDto dto, string currentUserId, bool isSuperAdmin);
    Task<MerchantDto?> UpdateAsync(int merchantId, MerchantUpdateDto dto, bool isSuperAdmin, string currentUserId);
    Task<bool> DeleteAsync(int merchantId, bool isSuperAdmin, string currentUserId, int? currentMerchantId);
    Task<bool> RestoreAsync(int merchantId, bool isSuperAdmin, string currentUserId, int? currentMerchantId);

    Task<IEnumerable<MerchantSubscriptionDto>> GetSubscriptionsAsync(int merchantId, bool isSuperAdmin, int? currentMerchantId);
    Task<MerchantSubscriptionDto?> CreateSubscriptionAsync(int merchantId, MerchantSubscriptionCreateDto dto, bool isSuperAdmin, int? currentMerchantId);
    Task<bool> DeactivateSubscriptionAsync(int merchantId, int subscriptionId, bool isSuperAdmin, int? currentMerchantId);
    Task<bool> MerchantHasFeatureAsync(int merchantId, string featureName);
}
