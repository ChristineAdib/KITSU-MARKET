using System.Security.Claims;
using System.Security.Cryptography;
using KitsuMarket.API.Data;
using KitsuMarket.API.Data.Entities;
using KitsuMarket.API.Data.Seed;
using KitsuMarket.API.DTOs.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KitsuMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(ApplicationDbContext context, ILogger<OrdersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier claim is missing.");

    private async Task<string> GenerateUniqueOrderNumberAsync()
    {
        while (true)
        {
            var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
            var randomPart = RandomNumberGenerator.GetInt32(100000, 999999);
            var orderNumber = $"KM-{datePart}-{randomPart}";

            if (!await _context.Orders.AnyAsync(o => o.OrderNumber == orderNumber))
            {
                return orderNumber;
            }
        }
    }

    private static OrderDetailsDto MapToOrderDetailsDto(Order order)
    {
        return new OrderDetailsDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            UserId = order.UserId,
            CreatedAtUtc = order.CreatedAtUtc,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            TotalItems = order.Items.Sum(i => i.Quantity),
            ShippingFullName = order.ShippingFullName,
            ShippingPhone = order.ShippingPhone,
            ShippingAddress = order.ShippingAddress,
            ShippingCity = order.ShippingCity,
            Items = order.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductNameSnapshot,
                ProductImageUrl = i.ProductImageSnapshot,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                LineTotal = i.LineTotal
            }).ToList()
        };
    }

    /// <summary>
    /// Checkout the customer's cart and create an order (Atomic Transaction).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(OrderDetailsDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Checkout([FromBody] CreateOrderRequestDto dto)
    {
        var userId = GetUserId();

        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync<IActionResult>(async () =>
        {
            // 1. Retrieve the authenticated customer's cart
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.Items.Any())
            {
                return BadRequest(new { message = "Cannot checkout because your shopping cart is empty." });
            }

            // 2. Perform checkout within a database transaction
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var productIds = cart.Items.Select(i => i.ProductId).ToList();

                // Fetch products with tracking to update stock
                var products = await _context.Products
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync();

                var orderItems = new List<OrderItem>();
                decimal totalAmount = 0m;

                // 3. Recheck availability, quantities, calculate final prices, decrease stock
                foreach (var cartItem in cart.Items)
                {
                    var product = products.FirstOrDefault(p => p.Id == cartItem.ProductId);

                    if (product == null || !product.IsActive)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new
                        {
                            message = $"Product '{(product?.Name ?? "Item")}' is no longer available for purchase."
                        });
                    }

                    if (product.StockQuantity < cartItem.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new
                        {
                            message = $"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}, Requested: {cartItem.Quantity}.",
                            productId = product.Id,
                            availableStock = product.StockQuantity
                        });
                    }

                    var unitPrice = product.Price;
                    var lineTotal = unitPrice * cartItem.Quantity;
                    totalAmount += lineTotal;

                    // Decrease stock
                    product.StockQuantity -= cartItem.Quantity;
                    product.UpdatedAtUtc = DateTime.UtcNow;

                    // Create OrderItem snapshot
                    orderItems.Add(new OrderItem
                    {
                        ProductId = product.Id,
                        ProductNameSnapshot = product.Name,
                        ProductImageSnapshot = product.ImageUrl,
                        UnitPrice = unitPrice,
                        Quantity = cartItem.Quantity,
                        LineTotal = lineTotal
                    });
                }

                // 4. Create Order
                var orderNumber = await GenerateUniqueOrderNumberAsync();
                var order = new Order
                {
                    OrderNumber = orderNumber,
                    UserId = userId,
                    CreatedAtUtc = DateTime.UtcNow,
                    Status = OrderStatus.Pending,
                    TotalAmount = totalAmount,
                    ShippingFullName = dto.ShippingFullName.Trim(),
                    ShippingPhone = dto.ShippingPhone.Trim(),
                    ShippingAddress = dto.ShippingAddress.Trim(),
                    ShippingCity = dto.ShippingCity.Trim(),
                    Items = orderItems
                };

                _context.Orders.Add(order);

                // 5. Clear the customer's cart
                _context.CartItems.RemoveRange(cart.Items);
                cart.Items.Clear();
                cart.UpdatedAtUtc = DateTime.UtcNow;

                // 6. Commit transaction
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Order created successfully: {OrderNumber} for user {UserId}. Total: {Total} EGP",
                    order.OrderNumber, userId, order.TotalAmount);

                var resultDto = MapToOrderDetailsDto(order);
                return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, resultDto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Transaction failed during checkout for user {UserId}", userId);
                throw;
            }
        });
    }

    /// <summary>
    /// Retrieve the authenticated customer's order history.
    /// </summary>
    [HttpGet("my-orders")]
    [ProducesResponseType(typeof(IEnumerable<OrderSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = GetUserId();

        var orders = await _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Select(o => new OrderSummaryDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CreatedAtUtc = o.CreatedAtUtc,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                TotalItems = o.Items.Sum(i => i.Quantity),
                ShippingCity = o.ShippingCity
            })
            .ToListAsync();

        return Ok(orders);
    }

    /// <summary>
    /// Retrieve specific order details for the authenticated customer.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(OrderDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById([FromRoute] int id)
    {
        var userId = GetUserId();
        var isAdmin = User.IsInRole(DbInitializer.AdminRole);

        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"Order with ID {id} was not found." });
        }

        // Strict ownership check: Customer can only view their own orders
        if (order.UserId != userId && !isAdmin)
        {
            return NotFound(new { message = $"Order with ID {id} was not found." });
        }

        return Ok(MapToOrderDetailsDto(order));
    }
}
