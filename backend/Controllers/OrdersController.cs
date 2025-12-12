
using backend.Dtos;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;


namespace backend.Controllers;

public record CreateOrderRequest(
    string CustomerIdentifier,
    string EmployeeId,
    IEnumerable<OrderItemDto> Items,
    string Note
);

[Authorize]
[ApiController]
[Route("[controller]")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
        => Ok(await orderService.GetOrders());

    [HttpGet("{id}", Name = "GetOrder")]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
        => Ok(await orderService.GetOrder(id));

    [HttpPost]
    public async Task<ActionResult<OrderDto?>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var newOrder = await orderService.CreateOrder(request.CustomerIdentifier, request.EmployeeId, request.Items, request.Note);

        if (newOrder == null) return BadRequest();

        var uri = new Uri(Url.Link(
            nameof(GetOrder),
            new { id = newOrder.Id }
        ) ?? throw new InvalidOperationException("Could not generate order URI"));

        return Created(uri, newOrder);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder([FromRoute] int id)
    {
        var success = await orderService.DeleteOrder(id);
        
        return success ? NoContent() : NotFound();
    }
}
