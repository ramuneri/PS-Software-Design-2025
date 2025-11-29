using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IDiscountService
{
    Task<DiscountDto> CreateAsync(CreateDiscountDto dto);
    Task<IEnumerable<DiscountDto>> GetAllAsync(bool includeInactive = false);
    Task<DiscountDto?> GetByIdAsync(int id);
    Task<DiscountDto?> UpdateAsync(int id, UpdateDiscountDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> RestoreAsync(int id);
}
