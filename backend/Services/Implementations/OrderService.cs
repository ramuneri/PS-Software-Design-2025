
using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Enums;
using backend.Services.Interfaces;

namespace backend.Services.Implementations;

public class OrderService(ApplicationDbContext context) : IOrderService
{
    public async Task<OrderDto?> CreateOrder(string customerId, string employeeId, IEnumerable<OrderItemDto> orderItems, string note)
    {
        // TODO: Add employee and customer, change merchant id
        var orderItemDtos = orderItems.ToList();
        var order = new Order
        {
            MerchantId = 1,
            EmployeeId = employeeId,
            CustomerId = customerId,
            OrderItems = orderItemDtos.Select(item => new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity
            }).ToList(),
            Note = note,
            OpenedAt = DateTime.UtcNow
        };
        
        await context.Orders.AddAsync(order);
        await context.SaveChangesAsync();

        // TODO: get order item prices from products api
        return new OrderDto(
            order.Id,
            order.EmployeeId,
            order.CustomerId,
            orderItemDtos,
            null,
            0,
            0,
            0,
            note,
            Status.Open,
            order.OpenedAt,
            null,
            null
            );
    }
}
