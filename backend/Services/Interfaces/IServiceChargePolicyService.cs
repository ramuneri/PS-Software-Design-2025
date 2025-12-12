using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IServiceChargePolicyService
{
    Task<IEnumerable<ServiceChargePolicyDto>> GetAllAsync(
        int merchantId,
        bool includeInactive = false);

    Task<ServiceChargePolicyDto?> GetByIdAsync(int id);

    Task<ServiceChargePolicyDto> CreateAsync(CreateServiceChargePolicyDto dto);

    Task<ServiceChargePolicyDto?> UpdateAsync(int id, UpdateServiceChargePolicyDto dto);

    Task<bool> DeleteAsync(int id);

    Task<bool> RestoreAsync(int id);
}
