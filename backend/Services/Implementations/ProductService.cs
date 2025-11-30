using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _db;

    public ProductService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync(string? search = null)
    {
        var query = _db.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(p => p.Name!.ToLower().Contains(search));
        }

        return await query
            .Select(p => ToDto(p))
            .ToListAsync();
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        return product == null ? null : ToDto(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        int merchantId = 1; // TODO: replace when auth is added

        var product = new Product
        {
            MerchantId = merchantId,
            Name = dto.Name,
            Price = dto.Price,
            Category = dto.Category,
            TaxCategoryId = dto.TaxCategoryId,
            IsActive = dto.IsActive ?? true
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return ToDto(product);
    }

    public async Task<ProductDto?> UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return null;

        if (dto.Name != null) product.Name = dto.Name;
        if (dto.Price.HasValue) product.Price = dto.Price.Value;
        if (dto.Category != null) product.Category = dto.Category;
        if (dto.TaxCategoryId.HasValue) product.TaxCategoryId = dto.TaxCategoryId;
        if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;

        await _db.SaveChangesAsync();
        return ToDto(product);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return false;

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ProductDto ToDto(Product product) =>
        new ProductDto(
            product.ProductId,
            product.MerchantId,
            product.TaxCategoryId,
            product.Name,
            product.Price,
            product.Category,
            product.IsActive
        );
}
