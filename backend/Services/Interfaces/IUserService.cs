using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserListDto>> GetEmployeesAsync(int merchantId);
    Task<IEnumerable<UserListDto>> GetCustomersAsync(int merchantId);
}
