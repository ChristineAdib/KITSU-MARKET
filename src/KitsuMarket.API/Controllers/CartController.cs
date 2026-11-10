using System.Security.Claims;
using KitsuMarket.API.Data;
using KitsuMarket.API.Data.Entities;
using KitsuMarket.API.DTOs.Cart;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KitsuMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CartController> _logger;

    public CartController(ApplicationDbContext context, ILogger<CartController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User identifier claim is missing.");

    private async Task<Cart> GetOrCreateCartAsync(string userId)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = userId,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }

        return cart;
    }

    private static CartDto MapToCartDto(Cart cart)
    {
        var items = cart.Items.Select(i =>
        {
            var isAvailable = i.Product.IsActive && i.Product.StockQuantity >= i.Quantity;
            var unitPrice = i.Product.Price;
            var lineTotal = unitPrice * i.Quantity;

            return new CartItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                ProductSlug = i.Product.Slug,
                ProductImageUrl = i.Product.ImageUrl,
                UnitPrice = unitPrice,
                Quantity = i.Quantity,
                LineTotal = lineTotal,
                StockQuantity = i.Product.StockQuantity,
                IsAvailable = isAvailable
            };
        }).ToList();

        return new CartDto
        {
            Id = cart.Id,
            UserId = cart.UserId,
            Items = items,
            TotalItems = items.Sum(i => i.Quantity),
            TotalAmount = items.Sum(i => i.LineTotal),
            CreatedAtUtc = cart.CreatedAtUtc,
            UpdatedAtUtc = cart.UpdatedAtUtc
        };
    }

    /// <summary>
    /// Retrieve the current customer's shopping cart.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetUserId();
        var cart = await GetOrCreateCartAsync(userId);
        return Ok(MapToCartDto(cart));
    }

    /// <summary>
    /// Add a product to the cart or increment its quantity.
    /// </summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddItem([FromBody] AddToCartRequestDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null || !product.IsActive)
        {
            return BadRequest(new { message = "Product is not available for purchase." });
        }

        var userId = GetUserId();
        var cart = await GetOrCreateCartAsync(userId);

        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);
        var targetQuantity = (existingItem?.Quantity ?? 0) + dto.Quantity;

        if (targetQuantity > product.StockQuantity)
        {
            return BadRequest(new
            {
                message = $"Requested quantity ({targetQuantity}) exceeds available stock ({product.StockQuantity}).",
                availableStock = product.StockQuantity
            });
        }

        if (existingItem != null)
        {
            existingItem.Quantity = targetQuantity;
        }
        else
        {
            var newItem = new CartItem
            {
                CartId = cart.Id,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                Product = product
            };
            cart.Items.Add(newItem);
        }

        cart.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} added/updated in cart for user {UserId}. Quantity: {Quantity}",
            dto.ProductId, userId, targetQuantity);

        return Ok(MapToCartDto(cart));
    }

    /// <summary>
    /// Update the exact quantity of a product in the cart.
    /// </summary>
    [HttpPut("items/{productId:int}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem([FromRoute] int productId, [FromBody] UpdateCartItemRequestDto dto)
    {
        var userId = GetUserId();
        var cart = await GetOrCreateCartAsync(userId);

        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
        {
            return NotFound(new { message = $"Product with ID {productId} is not in your cart." });
        }

        var product = item.Product ?? await _context.Products.FindAsync(productId);
        if (product == null || !product.IsActive)
        {
            return BadRequest(new { message = "Product is no longer available." });
        }

        if (dto.Quantity > product.StockQuantity)
        {
            return BadRequest(new
            {
                message = $"Requested quantity ({dto.Quantity}) exceeds available stock ({product.StockQuantity}).",
                availableStock = product.StockQuantity
            });
        }

        item.Quantity = dto.Quantity;
        cart.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cart item {ProductId} quantity set to {Quantity} for user {UserId}",
            productId, dto.Quantity, userId);

        return Ok(MapToCartDto(cart));
    }

    /// <summary>
    /// Remove a product from the shopping cart.
    /// </summary>
    [HttpDelete("items/{productId:int}")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem([FromRoute] int productId)
    {
        var userId = GetUserId();
        var cart = await GetOrCreateCartAsync(userId);

        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
        {
            return NotFound(new { message = $"Product with ID {productId} is not in your cart." });
        }

        cart.Items.Remove(item);
        _context.CartItems.Remove(item);
        cart.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} removed from cart for user {UserId}", productId, userId);
        return Ok(MapToCartDto(cart));
    }

    /// <summary>
    /// Clear all items from the shopping cart.
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClearCart()
    {
        var userId = GetUserId();
        var cart = await GetOrCreateCartAsync(userId);

        if (cart.Items.Any())
        {
            _context.CartItems.RemoveRange(cart.Items);
            cart.Items.Clear();
            cart.UpdatedAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Cart cleared for user {UserId}", userId);
        return NoContent();
    }
}
