using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Mapping;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class ServiceChargePolicyService : IServiceChargePolicyService
{
    private readonly ApplicationDbContext _context;

    public ServiceChargePolicyService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ServiceChargePolicyDto>> GetAllAsync(int merchantId)
    {
        var policies = await _context.ServiceChargePolicies
            .Include(p => p.ServiceLinks)
            .Include(p => p.OrderLinks)
            .Where(p => p.MerchantId == merchantId)
            .ToListAsync();

        return policies.Select(p => p.ToDto());
    }

    public async Task<ServiceChargePolicyDto?> GetByIdAsync(int id)
    {
        var policy = await _context.ServiceChargePolicies
            .Include(p => p.ServiceLinks)
            .Include(p => p.OrderLinks)
            .FirstOrDefaultAsync(p => p.Id == id);

        return policy?.ToDto();
    }

    public async Task<ServiceChargePolicyDto> CreateAsync(CreateServiceChargePolicyDto dto)
    {
        var entity = dto.ToEntity();

        _context.ServiceChargePolicies.Add(entity);
        await _context.SaveChangesAsync();

        return entity.ToDto();
    }

    public async Task<ServiceChargePolicyDto?> UpdateAsync(
        int id,
        UpdateServiceChargePolicyDto dto)
    {
        var entity = await _context.ServiceChargePolicies
            .Include(p => p.ServiceLinks)
            .Include(p => p.OrderLinks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (entity is null)
            return null;

        entity.ApplyUpdate(dto);

        await _context.SaveChangesAsync();

        return entity.ToDto();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.ServiceChargePolicies.FindAsync(id);

        if (entity is null)
            return false;

        _context.ServiceChargePolicies.Remove(entity);
        await _context.SaveChangesAsync();

        return true;
    }
}
