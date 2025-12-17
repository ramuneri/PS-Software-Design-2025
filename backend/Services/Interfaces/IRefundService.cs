using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IRefundService
{
    Task<RefundResponseDto?> CreateRefundAsync(int orderId, RefundRequestDto request);
    Task<RefundDto?> GetRefundByIdAsync(int refundId);
    Task<IEnumerable<RefundDto>> GetRefundsByOrderIdAsync(int orderId);
    Task<IEnumerable<RefundDto>> GetAllRefundsAsync();
}
