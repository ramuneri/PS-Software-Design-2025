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
    private readonly IGiftCardService _giftCardService;

    public OrderService(
        ApplicationDbContext context,
        IProductService productService,
        IPaymentValidationService paymentValidator,
        IOrderCalculatorService orderCalculator,
        IStripePaymentService stripeService,
        ITaxService taxService,
        IGiftCardService giftCardService)
    {
        this.context = context;
        this.productService = productService;
        this.paymentValidator = paymentValidator;
        this.orderCalculator = orderCalculator;
        this.stripeService = stripeService;
        _taxService = taxService;
        _giftCardService = giftCardService;
    }

    private record SplitAllocation(
        int PayerIndex,
        decimal Subtotal,
        decimal Tax,
        decimal Discount,
        decimal ServiceCharge,
        decimal Tip,
        decimal Total,
        PaymentRequest Payment);

    public async Task<(OrderDto? Order, decimal? Change, string? PaymentIntentId, bool? Requires3DS, string? Error)>
        CloseOrderWithItemSplits(
            int orderId,
            List<SplitPaymentRequest> splits,
            TipRequest? tipRequest,
            decimal? discountAmount = null,
            decimal? serviceChargeAmount = null)
    {
        // Load order with related data
        var order = await context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Service)
            .Include(o => o.Payments)
            .Include(o => o.OrderTips)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return (null, null, null, null, "Order not found");
        if (order.ClosedAt != null) return (null, null, null, null, "Order is already closed");
        if (order.CancelledAt != null) return (null, null, null, null, "Cannot close a cancelled order");

        // Calculate overall totals for validation
        var totals = await orderCalculator.CalculateOrderTotalsAsync(order, discountAmount, serviceChargeAmount);
        if (totals.Remaining <= 0) return (null, null, null, null, "Order is already fully paid");

        // Build lookup for items
        var itemLookup = order.OrderItems.ToDictionary(oi => oi.Id);

        // Validate splits cover all items exactly once
        var assigned = new HashSet<int>();
        foreach (var split in splits)
        {
            foreach (var itemId in split.OrderItemIds)
            {
                if (!itemLookup.ContainsKey(itemId))
                    return (null, null, null, null, $"Order item {itemId} not found");
                if (!assigned.Add(itemId))
                    return (null, null, null, null, $"Order item {itemId} assigned multiple times");
            }
        }
        if (assigned.Count != itemLookup.Count)
            return (null, null, null, null, "Not all items were assigned to a payer");

        // Compute per-item totals (price * qty) and tax
        decimal grandItems = 0;
        var itemTotals = new Dictionary<int, (decimal itemTotal, decimal itemTax)>();
        foreach (var oi in order.OrderItems)
        {
            decimal price = oi.Product?.Price ?? oi.Service?.DefaultPrice ?? 0;
            var itemTotal = price * oi.Quantity;
            decimal taxRate = 0;
            if (oi.Product?.TaxCategoryId is int pcid)
                taxRate = await _taxService.GetRatePercentAtAsync(pcid, order.OpenedAt);
            else if (oi.Service?.TaxCategoryId is int scid)
                taxRate = await _taxService.GetRatePercentAtAsync(scid, order.OpenedAt);
            var itemTax = Math.Round(itemTotal * (taxRate / 100m), 2);
            itemTotals[oi.Id] = (itemTotal, itemTax);
            grandItems += itemTotal;
        }

        if (grandItems <= 0)
            return (null, null, null, null, "Cannot split zero-value order");

        decimal orderLevelDiscount = discountAmount ?? 0;
        decimal orderLevelService = serviceChargeAmount ?? 0;
        decimal orderLevelTip = tipRequest?.Amount ?? 0;

        var allocations = new List<SplitAllocation>();
        int payerIndex = 0;
        foreach (var split in splits)
        {
            var itemsSubtotal = split.OrderItemIds.Sum(id => itemTotals[id].itemTotal);
            var itemsTax = split.OrderItemIds.Sum(id => itemTotals[id].itemTax);
            var factor = itemsSubtotal / grandItems;

            var payerDiscount = Math.Round(orderLevelDiscount * factor, 2);
            var payerService = Math.Round(orderLevelService * factor, 2);
            var payerTip = Math.Round(orderLevelTip * factor, 2);

            var payerTotal = itemsSubtotal - payerDiscount + payerService + itemsTax + payerTip;

            allocations.Add(new SplitAllocation(
                payerIndex,
                itemsSubtotal,
                itemsTax,
                payerDiscount,
                payerService,
                payerTip,
                payerTotal,
                new PaymentRequest(split.Method, payerTotal, split.Currency, null, null)
            ));
            payerIndex++;
        }

        // Validate total matches required (allow small rounding diff)
        var totalCollected = allocations.Sum(a => a.Total);
        var diff = Math.Abs(totalCollected - totals.Remaining);
        if (diff > 0.02m)
        {
            return (null, null, null, null, $"Split totals do not match order. Remaining: {totals.Remaining:F2}, Collected: {totalCollected:F2}");
        }

        // Reuse CloseOrderWithPayments with computed payment requests
        var paymentRequests = allocations.Select(a => a.Payment).ToList();
        return await CloseOrderWithPayments(orderId, paymentRequests, tipRequest, discountAmount, serviceChargeAmount);
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
            var calcTotals = await orderCalculator.CalculateOrderTotalsAsync(order);
            if (calcTotals.TaxBreakdown.Any())
            {
                var categories = await _taxService.GetCategoriesAsync(includeInactive: true);
                foreach (var tb in calcTotals.TaxBreakdown)
                {
                    var cat = categories.FirstOrDefault(c => c.Id == tb.TaxCategoryId);
                    if (cat != null)
                    {
                        tb.CategoryName = cat.Name;
                    }
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
                order.CancelledAt,
                calcTotals.TaxBreakdown
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
        var calcTotals = await orderCalculator.CalculateOrderTotalsAsync(order);
        if (calcTotals.TaxBreakdown.Any())
        {
            var categories = await _taxService.GetCategoriesAsync(includeInactive: true);
            foreach (var tb in calcTotals.TaxBreakdown)
            {
                var cat = categories.FirstOrDefault(c => c.Id == tb.TaxCategoryId);
                if (cat != null)
                {
                    tb.CategoryName = cat.Name;
                }
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
            order.CancelledAt,
            calcTotals.TaxBreakdown
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
        var calcTotals = await orderCalculator.CalculateOrderTotalsAsync(order);

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
            null,
            calcTotals.TaxBreakdown
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
        TipRequest? tipRequest,
        decimal? discountAmount = null,
        decimal? serviceChargeAmount = null)
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

            // 3. Calculate order totals (with discount and service charge from request)
            var totals = await orderCalculator.CalculateOrderTotalsAsync(order, discountAmount, serviceChargeAmount);

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
            var giftcardPaymentRecords = new List<GiftcardPayment>();

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
                else if (method == "GIFT_CARD")
                {
                    if (string.IsNullOrWhiteSpace(paymentReq.GiftCardCode))
                    {
                        await transaction.RollbackAsync();
                        return (null, null, null, null, "Gift card code is required");
                    }

                    var giftcard = await context.Giftcards
                        .FirstOrDefaultAsync(g => g.Code == paymentReq.GiftCardCode && 
                                                   g.IsActive && 
                                                   g.DeletedAt == null &&
                                                   (g.ExpiresAt == null || g.ExpiresAt > DateTime.UtcNow));

                    if (giftcard == null)
                    {
                        await transaction.RollbackAsync();
                        return (null, null, null, null, "Gift card not found or expired");
                    }

                    if (giftcard.Balance < paymentAmount)
                    {
                        await transaction.RollbackAsync();
                        return (null, null, null, null, 
                            $"Insufficient gift card balance. Available: {giftcard.Balance:F2}, Required: {paymentAmount:F2}");
                    }

                    giftcard.Balance -= paymentAmount;
                    giftcard.UpdatedAt = DateTime.UtcNow;

                    var giftCardPayment = new Payment
                    {
                        OrderId = orderId,
                        Method = "GIFT_CARD",
                        Amount = paymentAmount,
                        Currency = paymentReq.Currency,
                        Provider = null,
                        PaymentStatus = "SUCCEEDED"
                    };

                    context.Payments.Add(giftCardPayment);
                    await context.SaveChangesAsync();

                    var giftcardPaymentRecord = new GiftcardPayment
                    {
                        PaymentId = giftCardPayment.PaymentId,
                        GiftcardId = giftcard.GiftcardId,
                        AmountUsed = paymentAmount
                    };
                    giftcardPaymentRecords.Add(giftcardPaymentRecord);

                    remainingBalance -= paymentAmount;
                }
            }

            context.GiftcardPayments.AddRange(giftcardPaymentRecords);

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
            if (orderItem.ProductId != null && orderItem.Product != null)
            {
                var product = orderItem.Product;
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
                    itemTotal ?? 0,
                    product.Name,
                    null
                ));
            }
            else if (orderItem.ServiceId != null && orderItem.Service != null)
            {
                var service = orderItem.Service;
                var itemTotal = service.DefaultPrice * orderItem.Quantity;
                subTotal += itemTotal ?? 0;

                decimal taxRate = 0;
                if (service.TaxCategoryId.HasValue)
                {
                    var at = order.OpenedAt;
                    taxRate = await _taxService.GetRatePercentAtAsync(service.TaxCategoryId.Value, at);
                }

                var itemTax = Math.Round((itemTotal ?? 0) * (taxRate / 100m), 2);
                taxTotal += itemTax;

                orderItemDtos.Add(new OrderItemDto(
                    orderItem.Id,
                    orderItem.OrderId,
                    0,
                    orderItem.Quantity,
                    itemTotal ?? 0,
                    null,
                    service.Name
                ));
            }
        }

        return (orderItemDtos, subTotal, taxTotal);
    }
}
