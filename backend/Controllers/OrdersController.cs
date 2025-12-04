
using backend.Dtos;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;


namespace backend.Controllers;

public record CreateOrderRequest(
    string CustomerId,
    string EmployeeId,
    IEnumerable<OrderItemDto> Items,
    string Note
);

[Authorize]
[ApiController]
[Route("[controller]")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet("{id}", Name = "GetOrder")]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
    {
        throw new NotImplementedException();
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto?>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var newOrder = await orderService.CreateOrder(request.CustomerId, request.EmployeeId, request.Items, request.Note);

        if (newOrder == null) return BadRequest();

        var uri = new Uri(Url.Link(
            nameof(GetOrder),
            new { id = newOrder.Id }
        ) ?? throw new InvalidOperationException("Could not generate order URI"));

        return Created(uri, newOrder);
    }
}
