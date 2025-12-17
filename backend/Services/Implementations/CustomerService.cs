using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class CustomerService(ApplicationDbContext db) : ICustomerService
{
    public async Task<IEnumerable<CustomerDto>> GetAllAsync(
        int merchantId,
        string? q,
        bool includeInactive,
        int limit,
        int offset)
    {
        var query = db.Customers
            .Where(c => c.MerchantId == merchantId);

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(c =>
                (!string.IsNullOrEmpty(c.Name) && c.Name.ToLower().Contains(term)) ||
                (!string.IsNullOrEmpty(c.Surname) && c.Surname.ToLower().Contains(term)) ||
                (!string.IsNullOrEmpty(c.Email) && c.Email.ToLower().Contains(term)) ||
                (!string.IsNullOrEmpty(c.Phone) && c.Phone.ToLower().Contains(term))
            );
        }

        var items = await query
            .OrderBy(c => c.Id)
            .Skip(offset)
            .Take(Math.Max(1, limit))
            .ToListAsync();

        return items.Select(ToDto);
    }

    public async Task<CustomerDto?> GetByIdAsync(int id)
    {
        var entity = await db.Customers.FindAsync(id);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<CustomerDto> CreateAsync(int merchantId, CustomerCreateDto dto)
    {
        var entity = new Customer
        {
            MerchantId = merchantId,
            Name = dto.Name?.Trim(),
            Surname = dto.Surname?.Trim(),
            Email = dto.Email?.Trim(),
            Phone = dto.Phone?.Trim(),
            IsActive = true
        };

        db.Customers.Add(entity);

        // Also create a lightweight Identity user so the customer is selectable in reservations.
        var email = entity.Email?.Trim() ?? string.Empty;
        var normalizedEmail = string.IsNullOrWhiteSpace(email) ? null : email.ToUpperInvariant();
        var existingUser = await db.Users.FirstOrDefaultAsync(u =>
            u.MerchantId == merchantId &&
            ((!string.IsNullOrWhiteSpace(normalizedEmail) && u.NormalizedEmail == normalizedEmail) ||
             (!string.IsNullOrWhiteSpace(email) && u.Email == email)));

        if (existingUser == null)
        {
            var now = DateTime.UtcNow;
            var userId = Guid.NewGuid().ToString();
            var username = string.IsNullOrWhiteSpace(email)
                ? $"customer-{userId}"
                : email;

            db.Users.Add(new User
            {
                Id = userId,
                MerchantId = merchantId,
                Name = entity.Name,
                Surname = entity.Surname,
                Email = email,
                NormalizedEmail = normalizedEmail,
                UserName = username,
                NormalizedUserName = username.ToUpperInvariant(),
                PhoneNumber = entity.Phone,
                Role = "Customer",
                IsActive = true,
                EmailConfirmed = false,
                PhoneNumberConfirmed = false,
                TwoFactorEnabled = false,
                LockoutEnabled = false,
                AccessFailedCount = 0,
                PasswordHash = string.Empty,
                CreatedAt = now,
                UpdatedAt = now,
                LastLoginAt = now,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            });
        }

        await db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto)
    {
        var entity = await db.Customers.FindAsync(id);
        if (entity == null) return null;

        if (dto.Name != null) entity.Name = dto.Name.Trim();
        if (dto.Surname != null) entity.Surname = dto.Surname.Trim();
        if (dto.Email != null) entity.Email = dto.Email.Trim();
        if (dto.Phone != null) entity.Phone = dto.Phone.Trim();
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;

        await db.SaveChangesAsync();
        return ToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await db.Customers.FindAsync(id);
        if (entity == null) return false;

        entity.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var entity = await db.Customers.FindAsync(id);
        if (entity == null) return false;

        entity.IsActive = true;
        await db.SaveChangesAsync();
        return true;
    }

    private static CustomerDto ToDto(Customer c) =>
        new(
            c.Id,
            c.MerchantId,
            c.Name,
            c.Surname,
            c.Email,
            c.Phone,
            c.IsActive
        );
}
