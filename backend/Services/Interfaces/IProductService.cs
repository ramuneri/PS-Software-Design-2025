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
}
