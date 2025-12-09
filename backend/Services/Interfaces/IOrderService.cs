
using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IOrderService
{
    public Task<IEnumerable<OrderDto>> GetOrders();
    public Task<OrderDto> GetOrder(int id);
    public Task<OrderDto?> CreateOrder(string customerId, string employeeId, IEnumerable<OrderItemDto> orderItems, string note);
}
