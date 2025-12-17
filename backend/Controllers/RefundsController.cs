using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class RefundsController(IRefundService refundService) : ControllerBase
{
    [HttpPost("{orderId:int}")]
    [Authorize(Roles = "Employee,Manager,Admin")]
    public async Task<ActionResult<RefundResponseDto>> CreateRefund(
        int orderId,
        [FromBody] RefundRequestDto request)
    {
        try
        {
            var refund = await refundService.CreateRefundAsync(orderId, request);
            
            if (refund == null)
                return BadRequest("Failed to create refund");

            return CreatedAtAction(nameof(GetRefund), new { refundId = refund.RefundId }, refund);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", detail = ex.Message });
        }
    }

    [HttpGet("{refundId:int}", Name = "GetRefund")]
    public async Task<ActionResult<RefundDto>> GetRefund(int refundId)
    {
        var refund = await refundService.GetRefundByIdAsync(refundId);
        
        if (refund == null)
            return NotFound();

        return Ok(refund);
    }

    [HttpGet("order/{orderId:int}")]
    public async Task<ActionResult<IEnumerable<RefundDto>>> GetOrderRefunds(int orderId)
    {
        var refunds = await refundService.GetRefundsByOrderIdAsync(orderId);
        return Ok(refunds);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RefundDto>>> GetAllRefunds()
    {
        var refunds = await refundService.GetAllRefundsAsync();
        return Ok(refunds);
    }
}
