using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Enums;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext context;
    private readonly IProductService productService;

    public OrderService(ApplicationDbContext context, IProductService productService)
    {
        this.context = context;
        this.productService = productService;
    }

    public async Task<IEnumerable<OrderDto>> GetOrders()
    {
        var orders = await context.Orders
            .Include(o => o.OrderItems)
            .ToListAsync();

        var orderDtos = new List<OrderDto>();

        foreach (var order in orders)
        {
            decimal subTotal = 0;
            var orderItemDtos = new List<OrderItemDto>();

            foreach (var orderItem in order.OrderItems)
            {
                var product = await productService.GetByIdAsync(orderItem.ProductId!.Value);

                if (product != null)
                {
                    var itemTotal = product.Price * orderItem.Quantity;
                    subTotal += itemTotal ?? 0;

                    orderItemDtos.Add(new OrderItemDto(
                        orderItem.Id,
                        orderItem.OrderId,
                        orderItem.ProductId ?? 0,
                        orderItem.Quantity,
                        itemTotal ?? 0
                    ));
                }
            }
            
            var status = order.CancelledAt is not null ? Status.Cancelled :
                order.ClosedAt is not null ? Status.Closed :
                Status.Open;
            
            orderDtos.Add(new OrderDto(
                order.Id,
                order.EmployeeId,
                order.CustomerIdentifier,
                orderItemDtos,
                null,
                subTotal,
                0, // TODO: calculate tax
                subTotal, // TODO: subTotal + tax
                order.Note,
                status,
                order.OpenedAt,
                order.ClosedAt,
                order.CancelledAt
            ));
        }

        return orderDtos;
    }

    public async Task<OrderDto?> GetOrder(int id)
    {
        var order = await context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return null;
        }

        decimal subTotal = 0;
        var orderItemDtos = new List<OrderItemDto>();

        foreach (var orderItem in order.OrderItems)
        {
            var product = await productService.GetByIdAsync(orderItem.ProductId!.Value);

            if (product != null)
            {
                var itemTotal = product.Price * orderItem.Quantity;
                subTotal += itemTotal ?? 0;

                orderItemDtos.Add(new OrderItemDto(
                    orderItem.Id,
                    orderItem.OrderId,
                    orderItem.ProductId ?? 0,
                    orderItem.Quantity,
                    itemTotal ?? 0
                ));
            }
        }
    
        var status = order.CancelledAt is not null ? Status.Cancelled :
            order.ClosedAt is not null ? Status.Closed :
            Status.Open;
    
        return new OrderDto(
            order.Id,
            order.EmployeeId,
            order.CustomerIdentifier,
            orderItemDtos,
            null,
            subTotal,
            0, // TODO: calculate tax
            subTotal, // TODO: subTotal + tax
            order.Note,
            status,
            order.OpenedAt,
            order.ClosedAt,
            order.CancelledAt
        );
    }

    public async Task<OrderDto?> CreateOrder(string customerIdentifier, string employeeId, IEnumerable<OrderItemDto> orderItems, string note)
    {
        orderItems = orderItems.ToList();

        var order = new Order
        {
            MerchantId = 1,
            EmployeeId = employeeId,
            CustomerIdentifier = customerIdentifier,
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
            var product = await productService.GetByIdAsync(orderItemEntity.ProductId!.Value);

            if (product != null)
            {
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
            order.CustomerIdentifier,
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

    public async Task<OrderDto?> UpdateOrder(int id, string? customerIdentifier, IEnumerable<OrderItemDto>? items, string? note)
    {
        var order = await context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return null;
        }
        
        if (customerIdentifier != null)
        {
            order.CustomerIdentifier = customerIdentifier;
        }
        
        if (note != null)
        {
            order.Note = note;
        }
        
        if (items != null)
        {
            var itemsList = items.ToList();
            
            context.OrderItems.RemoveRange(order.OrderItems);
            
            var newOrderItems = itemsList.Select(item => new OrderItem
            {
                OrderId = order.Id,
                ProductId = item.ProductId,
                Quantity = item.Quantity
            }).ToList();
        
            await context.OrderItems.AddRangeAsync(newOrderItems);
        }

        await context.SaveChangesAsync();
        
        return await GetOrder(id);
    }
    
    public async Task<bool> DeleteOrder(int id)
    {
        var order = await context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return false;
        }
        
        context.OrderItems.RemoveRange(order.OrderItems);
        
        context.Orders.Remove(order);
        
        await context.SaveChangesAsync();

        return true;
    }
}
