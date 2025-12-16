using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _service;

    public ProductsController(IProductService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? taxCategoryId,
        [FromQuery] bool? active = true)
    {
        var data = await _service.GetAllAsync(taxCategoryId, active);
        return Ok(new { data });
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new List<ProductDto>());

        return Ok(await _service.SearchAsync(q));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    // POST /api/products
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(CreateProductDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize]
    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, UpdateProductDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return updated == null ? NotFound() : Ok(updated);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
        => await _service.DeleteAsync(id) ? NoContent() : NotFound();

    [Authorize]
    [HttpPost("{id:int}/restore")]
    public async Task<ActionResult> Restore(int id)
        => await _service.RestoreAsync(id) ? NoContent() : NotFound();
    
    [HttpGet("{id:int}/variations")]
    public async Task<ActionResult<IEnumerable<ProductVariationDto>>> GetVariations(int id)
    {
        var variations = await _service.GetVariationsAsync(id);
        return Ok(new { data = variations });
    }
    
    [Authorize]
    [HttpPost("{id:int}/variations")]
    public async Task<ActionResult<ProductVariationDto>> CreateVariation(
        int id,
        CreateProductVariationDto dto)
    {
        try
        {
            var created = await _service.CreateVariationAsync(id, dto);
            return Ok(new { data = created });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
    
    [Authorize]
    [HttpPatch("{productId:int}/variations/{variationId:int}")]
    public async Task<ActionResult<ProductVariationDto>> UpdateVariation(
        int productId,
        int variationId,
        UpdateProductVariationDto dto)
    {
        var updated = await _service.UpdateVariationAsync(variationId, dto);
        return updated == null ? NotFound() : Ok(new { data = updated });
    }
    
    [Authorize]
    [HttpDelete("{productId:int}/variations/{variationId:int}")]
    public async Task<ActionResult> DeleteVariation(int productId, int variationId) 
        => await _service.DeleteVariationAsync(variationId) ? NoContent() : NotFound();
}
