using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Enums;
using backend.Services;
using backend.Services.Interfaces;
using backend.Services.Implementations;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext context;
    private readonly IProductService productService;
    private readonly IPaymentValidationService paymentValidator;
    private readonly IOrderCalculatorService orderCalculator;
    private readonly IStripePaymentService stripeService;
    private readonly ITaxService _taxService;

    public OrderService(
        ApplicationDbContext context,
        IProductService productService,
        IPaymentValidationService paymentValidator,
        IOrderCalculatorService orderCalculator,
        IStripePaymentService stripeService,
        ITaxService taxService)
    {
        this.context = context;
        this.productService = productService;
        this.paymentValidator = paymentValidator;
        this.orderCalculator = orderCalculator;
        this.stripeService = stripeService;
        _taxService = taxService;
    }

    public async Task<IEnumerable<OrderDto>> GetOrders()
    {
        var orders = await context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Service)
            .Include(o => o.Payments)  // ADDED: Include payments
            .Include(o => o.OrderTips)  // ADDED: Include tips
            .ToListAsync();

        var orderDtos = new List<OrderDto>();

        foreach (var order in orders)
        {
            var (orderItemDtos, subTotal, taxTotal) = await CalculateTotals(order);

            var status = order.CancelledAt is not null ? Status.Cancelled :
                order.ClosedAt is not null ? Status.Closed :
                Status.Open;

            orderDtos.Add(new OrderDto(
                order.Id,
                order.EmployeeId,
                order.CustomerIdentifier,
                orderItemDtos,
                order.Payments?.Select(p => new PaymentDto(
                    p.PaymentId,
                    p.OrderId,
                    p.Method,
                    p.Amount,
                    p.Provider,
                    p.Currency,
                    p.PaymentStatus
                )).ToList(),
                subTotal,
                taxTotal,
                subTotal + taxTotal,
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
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Service)
            .Include(o => o.Payments)
            .Include(o => o.OrderTips)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return null;
        }

        var (orderItemDtos, subTotal, taxTotal) = await CalculateTotals(order);

        var status = order.CancelledAt is not null ? Status.Cancelled :
            order.ClosedAt is not null ? Status.Closed :
            Status.Open;

        return new OrderDto(
            order.Id,
            order.EmployeeId,
            order.CustomerIdentifier,
            orderItemDtos,
            order.Payments?.Select(p => new PaymentDto(
                p.PaymentId,
                p.OrderId,
                p.Method,
                p.Amount,
                p.Provider,
                p.Currency,
                p.PaymentStatus
            )).ToList(),
            subTotal,
            taxTotal,
            subTotal + taxTotal,
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

        order.OrderItems = orderItemEntities;
        var (orderItemDtos, subTotal, taxTotal) = await CalculateTotals(order);

        return new OrderDto(
            order.Id,
            order.EmployeeId,
            order.CustomerIdentifier,
            orderItemDtos,
            null,
            subTotal,
            taxTotal,
            subTotal + taxTotal,
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

    public async Task<OrderDto?> CloseOrder(int id)
    {
        var order = await context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return null;

        if (order.CancelledAt is not null) return null;

        if (order.ClosedAt is not null) return await GetOrder(id);

        order.ClosedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return await GetOrder(id);
    }


    public async Task<OrderDto?> CancelOrder(int id)
    {
        var order = await context.Orders.FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return null;

        if (order.CancelledAt is not null)
            return await GetOrder(id);

        if (order.ClosedAt is not null)
            return null;

        order.CancelledAt = DateTime.UtcNow;
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

    public async Task<(OrderDto? Order, decimal? Change, string? PaymentIntentId, bool? Requires3DS, string? Error)>
    CloseOrderWithPayments(
        int orderId,
        List<PaymentRequest> paymentRequests,
        TipRequest? tipRequest)
    {
        using var transaction = await context.Database.BeginTransactionAsync();

        try
        {
            // 1. Load order with all related data
            var order = await context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Service)
                .Include(o => o.Payments)
                .Include(o => o.OrderTips)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return (null, null, null, null, "Order not found");

            // 2. Validate order state
            if (order.ClosedAt != null)
                return (null, null, null, null, "Order is already closed");

            if (order.CancelledAt != null)
                return (null, null, null, null, "Cannot close a cancelled order");

            // 3. Calculate order totals
            var totals = orderCalculator.CalculateOrderTotals(order);

            if (totals.Remaining <= 0)
                return (null, null, null, null, "Order is already fully paid");

            // 4. Validate total payment amount
            var totalPaymentAmount = paymentRequests.Sum(p => p.Amount);
            if (totalPaymentAmount < totals.Remaining)
            {
                return (null, null, null, null,
                    $"Insufficient payment. Required: {totals.Remaining:F2}, Provided: {totalPaymentAmount:F2}");
            }

            // 5. Process each payment
            decimal? change = null;
            string? paymentIntentId = null;
            bool? requires3DS = false;
            var remainingBalance = totals.Remaining;

            foreach (var paymentReq in paymentRequests)
            {
                // Validate payment
                var validation = paymentValidator.ValidatePayment(paymentReq, remainingBalance);
                if (!validation.IsValid)
                    return (null, null, null, null, validation.Error);

                var paymentAmount = paymentReq.Amount;
                var method = paymentReq.Method.ToUpperInvariant();

                // Process based on payment method
                if (method == "CASH")
                {
                    // Calculate change for cash
                    if (paymentAmount > remainingBalance)
                    {
                        change = paymentAmount - remainingBalance;
                        paymentAmount = remainingBalance;
                    }

                    // Create cash payment record
                    var cashPayment = new Payment
                    {
                        OrderId = orderId,
                        Method = "CASH",
                        Amount = paymentAmount,
                        Currency = paymentReq.Currency,
                        Provider = null,
                        PaymentStatus = "SUCCEEDED"
                    };

                    context.Payments.Add(cashPayment);
                    remainingBalance -= paymentAmount;
                }
                else if (method == "CARD")
                {
                    // Process card payment through Stripe
                    var stripeResult = await stripeService.ProcessPaymentAsync(
                        paymentAmount,
                        paymentReq.Currency,
                        paymentReq.IdempotencyKey!
                    );

                    if (!stripeResult.Success)
                    {
                        if (stripeResult.Requires3DS)
                        {
                            // Return 3DS required response
                            await transaction.RollbackAsync();
                            return (null, null, stripeResult.PaymentIntentId, true,
                                "3D Secure authentication required");
                        }

                        return (null, null, null, null,
                            stripeResult.ErrorMessage ?? "Card payment failed");
                    }

                    // Create card payment record
                    var cardPayment = new Payment
                    {
                        OrderId = orderId,
                        Method = "CARD",
                        Amount = paymentAmount,
                        Currency = paymentReq.Currency,
                        Provider = "STRIPE",
                        PaymentStatus = "SUCCEEDED"
                        // Todo: Add ProviderTransactionId field to Payment model
                        // cardPayment.ProviderTransactionId = stripeResult.TransactionId;
                    };

                    context.Payments.Add(cardPayment);
                    paymentIntentId = stripeResult.PaymentIntentId;
                    remainingBalance -= paymentAmount;
                }
                // Gift card handling
            }

            // 6. Record tip if provided
            if (tipRequest != null && tipRequest.Amount > 0)
            {
                var orderTip = new OrderTip
                {
                    OrderId = orderId,
                    Source = tipRequest.Source,
                    Amount = tipRequest.Amount,
                    CreatedAt = DateTime.UtcNow
                };
                context.OrderTips.Add(orderTip);
            }

            // 7. Close the order
            order.ClosedAt = DateTime.UtcNow;

            // 8. Save all changes
            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            // 9. Return result
            var orderDto = await GetOrder(orderId);
            return (orderDto, change, paymentIntentId, requires3DS, null);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return (null, null, null, null, $"Payment processing failed: {ex.Message}");
        }
    }

    private async Task<(List<OrderItemDto> Items, decimal SubTotal, decimal Tax)> CalculateTotals(Order order)
    {
        decimal subTotal = 0;
        decimal taxTotal = 0;
        var orderItemDtos = new List<OrderItemDto>();

        foreach (var orderItem in order.OrderItems)
        {
            if (orderItem.ProductId == null)
                continue;

            var product = await productService.GetByIdAsync(orderItem.ProductId.Value);

            if (product != null)
            {
                var itemTotal = product.Price * orderItem.Quantity;
                subTotal += itemTotal ?? 0;

                decimal taxRate = 0;
                if (product.TaxCategoryId.HasValue)
                {
                    var at = order.OpenedAt;
                    taxRate = await _taxService.GetRatePercentAtAsync(product.TaxCategoryId.Value, at);
                }

                var itemTax = Math.Round((itemTotal ?? 0) * (taxRate / 100m), 2);
                taxTotal += itemTax;

                orderItemDtos.Add(new OrderItemDto(
                    orderItem.Id,
                    orderItem.OrderId,
                    orderItem.ProductId ?? 0,
                    orderItem.Quantity,
                    itemTotal ?? 0
                ));
            }
        }

        return (orderItemDtos, subTotal, taxTotal);
    }
}
