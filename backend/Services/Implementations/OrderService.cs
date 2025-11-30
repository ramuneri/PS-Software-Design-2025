
using backend.Controllers;
using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Enums;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Services.Implementations;

public class OrderService(ApplicationDbContext context, ProductsController productsController) : IOrderService
{
    public async Task<OrderDto?> CreateOrder(string customerId, string employeeId, IEnumerable<OrderItemDto> orderItems, string note)
    {
        orderItems = orderItems.ToList();

        var order = new Order
        {
            MerchantId = 1,
            EmployeeId = employeeId,
            CustomerId = customerId,
            Note = note,
            OpenedAt = DateTime.UtcNow
        };

        await context.Orders.AddAsync(order);
        await context.SaveChangesAsync();

        var orderItemEntities = orderItems.Select(item => new OrderItem
        {
            OrderId = order.Id,
            ProductId = item.ProductId,
            Quantity = item.Quantity
        }).ToList();

        await context.OrderItems.AddRangeAsync(orderItemEntities);
        await context.SaveChangesAsync();

        decimal subTotal = 0;
        var orderItemDtos = new List<OrderItemDto>();

        foreach (var orderItemEntity in orderItemEntities)
        {
            var actionResult = await productsController.GetProduct(orderItemEntity.ProductId!.Value);

            if (actionResult.Result is OkObjectResult ok)
            {
                var product = (ProductDto)ok.Value!;
                var itemTotal = product.Price * orderItemEntity.Quantity;
                subTotal += itemTotal ?? 0;

                orderItemDtos.Add(new OrderItemDto(
                    orderItemEntity.Id,
                    orderItemEntity.OrderId,
                    orderItemEntity.ProductId ?? 0,
                    orderItemEntity.Quantity,
                    subTotal
                ));
            }
        }

        return new OrderDto(
            order.Id,
            order.EmployeeId,
            order.CustomerId,
            orderItemDtos,
            null,
            subTotal,
            0, // TODO: calculate tax
            subTotal, // TODO: subTotal + tax
            note,
            Status.Open,
            order.OpenedAt,
            null,
            null
        );
    }
}