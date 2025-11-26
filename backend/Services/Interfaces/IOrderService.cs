
using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IOrderService
{
    public Task<OrderDto?> CreateOrder();
}
