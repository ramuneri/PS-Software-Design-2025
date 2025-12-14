using backend.Dtos;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;


namespace backend.Controllers;

public record CreateOrderRequest(
    string CustomerIdentifier,
    string EmployeeId,
    IEnumerable<OrderItemDto> Items,
    string Note
);

public record UpdateOrderRequest(
    string? CustomerIdentifier,
    IEnumerable<OrderItemDto>? Items,
    string? Note
);

public record CreatePaymentRequest(
    string Method,
    decimal Amount,
    string Currency,
    string? Provider
);

public record CreatePaymentResponse(
    PaymentDto Data,
    decimal Change
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
    public async Task<IActionResult> CreateOrder(CreateOrderRequest request)
    {
        var employeeId =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (employeeId == null)
            return Unauthorized();

        var order = await orderService.CreateOrder(
            request.CustomerIdentifier,
            employeeId,
            request.Items,
            request.Note);

        if (order == null)
            return BadRequest();

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }


    [HttpPatch("{id}")]
    public async Task<ActionResult<OrderDto>> UpdateOrder([FromRoute] int id, [FromBody] UpdateOrderRequest request)
    {
        var updatedOrder = await orderService.UpdateOrder(id, request.CustomerIdentifier, request.Items, request.Note);

        if (updatedOrder == null) return NotFound();

        return Ok(updatedOrder);
    }

    [HttpPost("{id:int}/close")]
    public async Task<ActionResult<OrderDto>> CloseOrder(int id)
    {
        var closed = await orderService.CloseOrder(id);
        if (closed == null) return BadRequest();
        return Ok(closed);
    }


    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<OrderDto>> CancelOrder(int id)
    {
        var cancelledOrder = await orderService.CancelOrder(id);

        if (cancelledOrder == null)
            return NotFound();

        return Ok(cancelledOrder);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder([FromRoute] int id)
    {
        var success = await orderService.DeleteOrder(id);
        
        return success ? NoContent() : NotFound();
    }

    [HttpPost("{orderId:int}/payments")]
    public async Task<ActionResult<CreatePaymentResponse>> CreatePaymentForOrder(
    [FromRoute] int orderId,
    [FromBody] CreatePaymentRequest request)
    {
        var (payment, change, error) = await orderService.CreatePaymentForOrder(
            orderId,
            request.Method,
            request.Amount,
            request.Currency,
            request.Provider
        );

        if (error == "NOT_FOUND") return NotFound();
        if (error != null) return BadRequest(error);

        return StatusCode(StatusCodes.Status201Created, new CreatePaymentResponse(payment!, change));
    }

}
