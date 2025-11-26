using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class ServicesService : IServicesService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserManager<User> _userManager;

    public ServicesService(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        UserManager<User> userManager)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _userManager = userManager;
    }

    public async Task<IEnumerable<ServiceDto>> GetAllAsync(int? taxCategoryId, bool? active)
    {
        var query = _context.Services.AsQueryable();

        if (taxCategoryId.HasValue)
            query = query.Where(service => service.TaxCategoryId == taxCategoryId.Value);

        if (active.HasValue)
            query = query.Where(service => service.IsActive == active.Value);

        return await query
            .Select(service => new ServiceDto(
                service.ServiceId,
                service.MerchantId,
                service.TaxCategoryId,
                service.Name!,
                service.DefaultPrice ?? 0,
                service.DurationMinutes ?? 0,
                service.Description!,
                service.IsActive
            ))
            .ToListAsync();
    }

    public async Task<ServiceDto?> GetByIdAsync(int id)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null || !service.IsActive) return null;

        return new ServiceDto(
            service.ServiceId,
            service.MerchantId,
            service.TaxCategoryId,
            service.Name!,
            service.DefaultPrice ?? 0,
            service.DurationMinutes ?? 0,
            service.Description!,
            service.IsActive
        );
    }

    public async Task<ServiceDto> CreateAsync(CreateServiceRequest request)
    {
        var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext!.User);

        if (user == null || user.MerchantId == null)
            throw new Exception("Authenticated user is missing or not assigned to a merchant.");

        var service = new Service
        {
            MerchantId = user.MerchantId.Value,
            TaxCategoryId = request.TaxCategoryId,
            Name = request.Name,
            DefaultPrice = request.DefaultPrice,
            DurationMinutes = request.DurationMinutes,
            Description = request.Description,
            IsActive = request.IsActive
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        return new ServiceDto(
            service.ServiceId,
            service.MerchantId,
            service.TaxCategoryId,
            service.Name!,
            service.DefaultPrice ?? 0,
            service.DurationMinutes ?? 0,
            service.Description!,
            service.IsActive
        );
    }

    public async Task<ServiceDto?> UpdateAsync(int id, UpdateServiceRequest request)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null || !service.IsActive) return null;

        if (request.Name != null) service.Name = request.Name;
        if (request.DefaultPrice.HasValue) service.DefaultPrice = request.DefaultPrice;
        if (request.DurationMinutes.HasValue) service.DurationMinutes = request.DurationMinutes;
        if (request.Description != null) service.Description = request.Description;
        if (request.TaxCategoryId.HasValue) service.TaxCategoryId = request.TaxCategoryId;
        if (request.IsActive.HasValue) service.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null) return false;

        service.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null) return false;

        service.IsActive = true;
        await _context.SaveChangesAsync();
        return true;
    }
}
