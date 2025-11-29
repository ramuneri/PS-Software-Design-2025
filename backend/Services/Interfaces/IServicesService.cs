using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IServicesService
{
    Task<IEnumerable<ServiceDto>> GetAllAsync(int? taxCategoryId, bool? active);
    Task<ServiceDto?> GetByIdAsync(int id);
    Task<ServiceDto> CreateAsync(CreateServiceRequest request);
    Task<ServiceDto?> UpdateAsync(int id, UpdateServiceRequest request);
    Task<bool> SoftDeleteAsync(int id);
    Task<bool> RestoreAsync(int id);
}
