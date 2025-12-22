using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IPlanService
{
    Task<IEnumerable<PlanDto>> GetPlansAsync(bool includeInactive);
    Task<PlanDto?> GetPlanAsync(int id);
    Task<PlanDto> CreatePlanAsync(PlanCreateDto dto);
    Task<PlanDto?> UpdatePlanAsync(int id, PlanUpdateDto dto);
    Task<bool> DeletePlanAsync(int id);
    Task<bool> RestorePlanAsync(int id);

    Task<IEnumerable<FeatureDto>> GetFeaturesAsync(bool includeInactive);
    Task<FeatureDto?> GetFeatureAsync(int id);
    Task<FeatureDto> CreateFeatureAsync(FeatureCreateDto dto);
    Task<FeatureDto?> UpdateFeatureAsync(int id, FeatureUpdateDto dto);
    Task<bool> DeleteFeatureAsync(int id);
    Task<bool> RestoreFeatureAsync(int id);

    Task<bool> MerchantHasFeatureAsync(int merchantId, string featureName, DateTime? asOf = null);
}
