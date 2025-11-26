
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("[controller]")]
public class OrderController(IOrderService orderService) : ControllerBase
{
    public record CreateOrderRequest(string CustomerId, string EmployeeId, IEnumerable<OrderItemDto> Items, string Note);

    [HttpGet("{id}", Name = "GetOrder")]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
    {
        throw new NotImplementedException();
    }
    
    [HttpPost]
    public async Task<ActionResult<OrderDto?>> CreateOrder(CreateOrderRequest request)
    {
        var newOrder = await orderService.CreateOrder();
        
        if (newOrder == null) return BadRequest();
        
        var uri = new Uri(Url.Link(
            nameof(GetOrder),
            new { orderId = newOrder.Id }
        ) ?? throw new InvalidOperationException("Could not generate order URI"));
        
        return Created(uri, newOrder);
    }
}
