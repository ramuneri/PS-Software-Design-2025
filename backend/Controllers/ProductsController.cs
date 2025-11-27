using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Dtos.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ProductsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        var products = await _db.Products
            .Select(product => new ProductDto(
                product.ProductId,
                product.MerchantId,
                product.TaxCategoryId,
                product.Name,
                product.Price,
                product.Category,
                product.IsActive
            ))
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound();

        return Ok(new ProductDto(
            product.ProductId,
            product.MerchantId,
            product.TaxCategoryId,
            product.Name,
            product.Price,
            product.Category,
            product.IsActive
        ));
    }


    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct(ProductCreateDto dto)
    {
        // TODO: get merchant ID from authenticated user
        // for now using merchant 1 from seeding
        int merchantId = 1;

        var product = new Product
        {
            MerchantId = merchantId,
            Name = dto.Name,
            Price = dto.Price,
            Category = dto.Category,
            TaxCategoryId = dto.TaxCategoryId,
            IsActive = dto.IsActive
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, new ProductDto(
            product.ProductId,
            product.MerchantId,
            product.TaxCategoryId,
            product.Name,
            product.Price,
            product.Category,
            product.IsActive
        ));
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult> UpdateProduct(int id, ProductUpdateDto dto)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound();

        if (dto.Name != null)
            product.Name = dto.Name;

        if (dto.Price.HasValue)
            product.Price = dto.Price.Value;

        if (dto.Category != null)
            product.Category = dto.Category;

        if (dto.TaxCategoryId.HasValue)
            product.TaxCategoryId = dto.TaxCategoryId;

        if (dto.IsActive.HasValue)
            product.IsActive = dto.IsActive.Value;

        await _db.SaveChangesAsync();
        return NoContent();
    }


    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await _db.Products.FindAsync(id);

        if (product == null)
            return NotFound();

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();

        return NoContent();
    }


    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> SearchProducts([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new List<ProductDto>()); // empty list if no query

        q = q.Trim().ToLower();

        var results = await _db.Products
            .Where(product => product.Name.ToLower().Contains(q))
            .Select(product => new ProductDto(
                product.ProductId,
                product.MerchantId,
                product.TaxCategoryId,
                product.Name,
                product.Price,
                product.Category,
                product.IsActive
            ))
            .ToListAsync();

        return Ok(results);
    }

    [HttpGet("picker")]
    public async Task<ActionResult<IEnumerable<ProductPickerDto>>> Picker([FromQuery] string? query)
    {
        var q = _db.Products.AsQueryable();

        // only active products
        q = q.Where(product => product.IsActive);

        // apply search if provided
        if (!string.IsNullOrWhiteSpace(query))
        {
            string text = query.ToLower();
            q = q.Where(product => product.Name!.ToLower().Contains(text));
        }

        var result = await q
            .OrderBy(product => product.Name)
            .Select(product => new ProductPickerDto(
                product.ProductId,
                product.Name!,
                product.Price
            ))
            .Take(50)
            .ToListAsync();

        return Ok(result);
    }

}

