using KitsuMarket.API.Data;
using KitsuMarket.API.Data.Entities;
using KitsuMarket.API.Data.Seed;
using KitsuMarket.API.DTOs.Common;
using KitsuMarket.API.DTOs.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KitsuMarket.API.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = DbInitializer.AdminRole)]
public class AdminOrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminOrdersController> _logger;

    public AdminOrdersController(ApplicationDbContext context, ILogger<AdminOrdersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static AdminOrderDetailsDto MapToAdminOrderDetailsDto(Order order)
    {
        return new AdminOrderDetailsDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            UserId = order.UserId,
            CustomerEmail = order.User?.Email ?? string.Empty,
            CustomerFullName = order.User?.FullName ?? string.Empty,
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
    /// Retrieve all orders with filtering, searching, sorting and pagination (Admin only).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<AdminOrderSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllOrders([FromQuery] AdminOrderQueryParameters query)
    {
        var queryable = _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .AsQueryable();

        // Filter by Status
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var normalizedStatus = OrderStatus.Normalize(query.Status);
            queryable = queryable.Where(o => o.Status == normalizedStatus);
        }

        // Search in OrderNumber, ShippingFullName, ShippingCity, or CustomerEmail
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            queryable = queryable.Where(o =>
                o.OrderNumber.ToLower().Contains(search) ||
                o.ShippingFullName.ToLower().Contains(search) ||
                o.ShippingCity.ToLower().Contains(search) ||
                (o.User != null && o.User.Email != null && o.User.Email.ToLower().Contains(search)));
        }

        // Sorting
        queryable = query.SortBy?.ToLowerInvariant() switch
        {
            "total_asc" => queryable.OrderBy(o => o.TotalAmount),
            "total_desc" => queryable.OrderByDescending(o => o.TotalAmount),
            "oldest" => queryable.OrderBy(o => o.CreatedAtUtc),
            _ => queryable.OrderByDescending(o => o.CreatedAtUtc)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(o => new AdminOrderSummaryDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                UserId = o.UserId,
                CustomerEmail = o.User.Email ?? string.Empty,
                CustomerFullName = o.User.FullName ?? string.Empty,
                CreatedAtUtc = o.CreatedAtUtc,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                TotalItems = o.Items.Sum(i => i.Quantity),
                ShippingFullName = o.ShippingFullName,
                ShippingCity = o.ShippingCity
            })
            .ToListAsync();

        var result = new PagedResultDto<AdminOrderSummaryDto>(items, totalCount, query.Page, query.PageSize);
        return Ok(result);
    }

    /// <summary>
    /// Inspect any order with customer details and item snapshots (Admin only).
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AdminOrderDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById([FromRoute] int id)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"Order with ID {id} was not found." });
        }

        return Ok(MapToAdminOrderDetailsDto(order));
    }

    /// <summary>
    /// Update order status (Admin only). Supported: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled.
    /// </summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(AdminOrderDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrderStatus([FromRoute] int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (!OrderStatus.IsValid(dto.Status))
        {
            return BadRequest(new
            {
                message = $"Invalid order status '{dto.Status}'.",
                supportedStatuses = OrderStatus.All
            });
        }

        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound(new { message = $"Order with ID {id} was not found." });
        }

        var previousStatus = order.Status;
        var newStatus = OrderStatus.Normalize(dto.Status);

        // If transitioning to Cancelled, safely restore inventory
        if (newStatus == OrderStatus.Cancelled && previousStatus != OrderStatus.Cancelled)
        {
            var productIds = order.Items
                .Where(i => i.ProductId.HasValue)
                .Select(i => i.ProductId!.Value)
                .ToList();

            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            foreach (var item in order.Items)
            {
                if (item.ProductId.HasValue)
                {
                    var product = products.FirstOrDefault(p => p.Id == item.ProductId.Value);
                    if (product != null)
                    {
                        product.StockQuantity += item.Quantity;
                        product.UpdatedAtUtc = DateTime.UtcNow;
                    }
                }
            }
        }

        order.Status = newStatus;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderNumber} status updated from {OldStatus} to {NewStatus}",
            order.OrderNumber, previousStatus, newStatus);

        return Ok(MapToAdminOrderDetailsDto(order));
    }
}
