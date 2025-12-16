using backend.Dtos;

namespace backend.Services.Interfaces;

public interface ICustomerService
{
    Task<IEnumerable<CustomerDto>> GetAllAsync(
        int merchantId,
        string? q,
        bool includeInactive,
        int limit,
        int offset);

    Task<CustomerDto?> GetByIdAsync(int id);
    Task<CustomerDto> CreateAsync(int merchantId, CustomerCreateDto dto);
    Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> RestoreAsync(int id);
}
