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

    
    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<OrderDto>> CancelOrder(int id)
    {
        var cancelledOrder = await orderService.CancelOrder(id);

        if (cancelledOrder == null)
            return NotFound();

        return Ok(cancelledOrder);
    }

    [HttpPost("{id:int}/split-close")]
    public async Task<ActionResult<CloseOrderResponse>> CloseOrderSplit(
        int id,
        [FromBody] SplitCloseOrderRequest request)
    {
        var (order, change, paymentIntentId, requires3DS, error) =
            await orderService.CloseOrderWithItemSplits(
                id,
                request.Splits,
                request.Tip,
                request.DiscountAmount,
                request.ServiceChargeAmount
            );

        if (error != null)
            return BadRequest(new { message = error });

        if (order == null)
            return NotFound();

        return Ok(new CloseOrderResponse(
            Order: order,
            Change: change,
            PaymentIntentId: paymentIntentId,
            Requires3DS: requires3DS
        ));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrder([FromRoute] int id)
    {
        var success = await orderService.DeleteOrder(id);
        
        return success ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/close")]
    public async Task<ActionResult<CloseOrderResponse>> CloseOrder(
        int id,
        [FromBody] CloseOrderRequest request)
    {
        var (order, change, paymentIntentId, requires3DS, error) =
            await orderService.CloseOrderWithPayments(
                id,
                request.Payments,
                request.Tip,
                request.DiscountAmount,
                request.ServiceChargeAmount
            );

        if (error != null)
        {
            // Check if it's 3DS required
            if (requires3DS == true)
            {
                return Ok(new CloseOrderResponse(
                    Order: null!,
                    Change: null,
                    PaymentIntentId: paymentIntentId,
                    Requires3DS: true
                ));
            }

            return BadRequest(new { message = error });
        }

        if (order == null)
            return NotFound();

        return Ok(new CloseOrderResponse(
            Order: order,
            Change: change,
            PaymentIntentId: paymentIntentId,
            Requires3DS: requires3DS
        ));
    }

}
