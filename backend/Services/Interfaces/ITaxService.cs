using backend.Dtos;

namespace backend.Services.Interfaces;

public interface ITaxService
{
    Task<IEnumerable<TaxCategoryDto>> GetCategoriesAsync(bool includeInactive = false);
    Task<TaxCategoryDto?> GetCategoryAsync(int id, bool includeInactive = false);
    Task<TaxCategoryDto> CreateCategoryAsync(int merchantId, TaxCategoryDto dto);
    Task<TaxCategoryDto?> UpdateCategoryAsync(int id, TaxCategoryDto dto);
    Task<bool> DeleteCategoryAsync(int id);
    Task<bool> RestoreCategoryAsync(int id);

    Task<TaxRateDto?> AddRateAsync(int categoryId, TaxRateDto dto);
    Task<IEnumerable<TaxRateDto>> GetRatesAsync(int? taxCategoryId, DateTime? asOf, bool includeInactive = false);
    Task<TaxRateDto?> GetRateAsync(int id, bool includeInactive = false);
    Task<TaxRateDto?> UpdateRateAsync(int id, TaxRateDto dto);
    Task<bool> DeleteRateAsync(int id);
    Task<bool> RestoreRateAsync(int id);
    Task<decimal> GetRatePercentAtAsync(int taxCategoryId, DateTime atUtc);
}
