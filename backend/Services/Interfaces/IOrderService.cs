using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IOrderService
{
    public Task<IEnumerable<OrderDto>> GetOrders();
    public Task<OrderDto?> GetOrder(int id);
    public Task<OrderDto?> CreateOrder(string customerId, string employeeId, IEnumerable<OrderItemDto> orderItems, string note);
    public Task<OrderDto?> UpdateOrder(int id, string? customerIdentifier, IEnumerable<OrderItemDto>? items, string? note);
    public Task<OrderDto?> CloseOrder(int id);
    public Task<OrderDto?> CancelOrder(int id);
    public Task<bool> DeleteOrder(int id);

    public Task<(OrderDto? Order, decimal? Change, string? PaymentIntentId, bool? Requires3DS, string? Error)>
        CloseOrderWithPayments(
            int orderId,
            List<PaymentRequest> payments,
            TipRequest? tip);
}
