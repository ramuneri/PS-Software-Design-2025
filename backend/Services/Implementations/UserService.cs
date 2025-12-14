using backend.Data;
using backend.Dtos;
using backend.Mapping;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _db;

    public UserService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<UserListDto>> GetEmployeesAsync(int merchantId)
    {
        return await _db.Users
            .Where(u => u.MerchantId == merchantId && u.Role == "Employee")
            .Select(u => u.ToListDto())
            .ToListAsync();
    }

    public async Task<IEnumerable<UserListDto>> GetCustomersAsync(int merchantId)
    {
        return await _db.Users
            .Where(u => u.MerchantId == merchantId && u.Role == "Customer")
            .Select(u => u.ToListDto())
            .ToListAsync();
    }
}
