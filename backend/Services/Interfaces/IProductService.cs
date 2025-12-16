using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync(int? taxCategoryId, bool? active);
    Task<IEnumerable<ProductDto>> SearchAsync(string query);
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductDto dto);
    Task<ProductDto?> UpdateAsync(int id, UpdateProductDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> RestoreAsync(int id);
    
    Task<IEnumerable<ProductVariationDto>> GetVariationsAsync(int productId);
    Task<ProductVariationDto> CreateVariationAsync(int productId, CreateProductVariationDto dto);
    Task<ProductVariationDto?> UpdateVariationAsync(int variationId, UpdateProductVariationDto dto);
    Task<bool> DeleteVariationAsync(int variationId);
}
