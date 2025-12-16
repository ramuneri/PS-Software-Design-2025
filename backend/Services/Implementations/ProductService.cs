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

    public async Task<IEnumerable<ProductDto>> GetAllAsync(int? taxCategoryId, bool? active)
    {
        var query = _db.Products.AsQueryable();

        if (taxCategoryId.HasValue)
            query = query.Where(p => p.TaxCategoryId == taxCategoryId.Value);

        if (active.HasValue)
            query = query.Where(p => p.IsActive == active.Value);

        return await query
            .Select(p => ToDto(p))
            .ToListAsync();
    }

    public async Task<IEnumerable<ProductDto>> SearchAsync(string query)
    {
        query = query.Trim().ToLower();

        return await _db.Products
            .Where(p => p.Name!.ToLower().Contains(query))
            .Select(p => ToDto(p))
            .ToListAsync();
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return null;

        return ToDto(p);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto)
    {
        int merchantId = 1; // TODO — replace with actual merchant from auth

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
        var p = await _db.Products.FindAsync(id);
        if (p == null)
            return null;

        if (dto.Name != null) p.Name = dto.Name;
        if (dto.Price.HasValue) p.Price = dto.Price.Value;
        if (dto.Category != null) p.Category = dto.Category;
        if (dto.TaxCategoryId.HasValue) p.TaxCategoryId = dto.TaxCategoryId;
        if (dto.IsActive.HasValue) p.IsActive = dto.IsActive.Value;

        await _db.SaveChangesAsync();
        return ToDto(p);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return false;

        // Soft delete
        product.IsActive = false;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return false;

        product.IsActive = true;

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
    
    public async Task<IEnumerable<ProductVariationDto>> GetVariationsAsync(int productId)
    {
        return await _db.ProductVariations
            .Where(v => v.ProductId == productId)
            .OrderBy(v => v.Name)
            .Select(v => new ProductVariationDto(
                v.ProductVariationId,
                v.ProductId,
                v.Name,
                v.PriceAdjustment
            ))
            .ToListAsync();
    }

    public async Task<ProductVariationDto> CreateVariationAsync(int productId, CreateProductVariationDto dto)
    {
        var productExists = await _db.Products.AnyAsync(p => p.ProductId == productId);
        if (!productExists)
            throw new InvalidOperationException("Product not found");

        var variation = new ProductVariation
        {
            ProductId = productId,
            Name = dto.Name,
            PriceAdjustment = dto.PriceAdjustment
        };

        _db.ProductVariations.Add(variation);
        await _db.SaveChangesAsync();

        return new ProductVariationDto(
            variation.ProductVariationId,
            variation.ProductId,
            variation.Name,
            variation.PriceAdjustment
        );
    }

    public async Task<ProductVariationDto?> UpdateVariationAsync(int variationId, UpdateProductVariationDto dto)
    {
        var variation = await _db.ProductVariations.FindAsync(variationId);
        if (variation == null)
            return null;

        if (dto.Name != null) variation.Name = dto.Name;
        if (dto.PriceAdjustment.HasValue) variation.PriceAdjustment = dto.PriceAdjustment.Value;

        await _db.SaveChangesAsync();
    
        return new ProductVariationDto(
            variation.ProductVariationId,
            variation.ProductId,
            variation.Name,
            variation.PriceAdjustment
        );
    }

    public async Task<bool> DeleteVariationAsync(int variationId)
    {
        var variation = await _db.ProductVariations.FindAsync(variationId);
        if (variation == null)
            return false;

        _db.ProductVariations.Remove(variation);
        await _db.SaveChangesAsync();
        return true;
    }
}
