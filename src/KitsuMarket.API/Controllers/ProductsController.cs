using KitsuMarket.API.Common;
using KitsuMarket.API.Data;
using KitsuMarket.API.Data.Entities;
using KitsuMarket.API.Data.Seed;
using KitsuMarket.API.DTOs.Categories;
using KitsuMarket.API.DTOs.Common;
using KitsuMarket.API.DTOs.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KitsuMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(ApplicationDbContext context, ILogger<ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated, filtered, and sorted products (Public).
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResultDto<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] ProductQueryParameters query)
    {
        var queryable = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .AsQueryable();

        // Unless the caller is Admin, restrict to active products only
        bool isAdmin = User.IsInRole(DbInitializer.AdminRole);
        if (!isAdmin)
        {
            queryable = queryable.Where(p => p.IsActive);
        }

        // Filter by category
        if (query.CategoryId.HasValue)
        {
            queryable = queryable.Where(p => p.CategoryId == query.CategoryId.Value);
        }

        // Filter by featured
        if (query.IsFeatured.HasValue)
        {
            queryable = queryable.Where(p => p.IsFeatured == query.IsFeatured.Value);
        }

        // Filter by price range
        if (query.MinPrice.HasValue)
        {
            queryable = queryable.Where(p => p.Price >= query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            queryable = queryable.Where(p => p.Price <= query.MaxPrice.Value);
        }

        // Search in Name or Description
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            queryable = queryable.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.Description.ToLower().Contains(search));
        }

        // Sorting
        queryable = query.SortBy?.ToLowerInvariant() switch
        {
            "price_asc" => queryable.OrderBy(p => p.Price),
            "price_desc" => queryable.OrderByDescending(p => p.Price),
            "name_asc" => queryable.OrderBy(p => p.Name),
            "name_desc" => queryable.OrderByDescending(p => p.Name),
            "oldest" => queryable.OrderBy(p => p.CreatedAtUtc),
            _ => queryable.OrderByDescending(p => p.CreatedAtUtc) // Default newest first
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                IsActive = p.IsActive,
                IsFeatured = p.IsFeatured,
                CreatedAtUtc = p.CreatedAtUtc,
                UpdatedAtUtc = p.UpdatedAtUtc
            })
            .ToListAsync();

        var result = new PagedResultDto<ProductDto>(items, totalCount, query.Page, query.PageSize);
        return Ok(result);
    }

    /// <summary>
    /// Get product by ID (Public).
    /// </summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ProductDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} was not found." });
        }

        bool isAdmin = User.IsInRole(DbInitializer.AdminRole);
        if (!product.IsActive && !isAdmin)
        {
            return NotFound(new { message = $"Product with ID {id} is currently unavailable." });
        }

        var productDto = new ProductDetailsDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            ImageUrl = product.ImageUrl,
            CategoryId = product.CategoryId,
            Category = new CategoryDto
            {
                Id = product.Category.Id,
                Name = product.Category.Name,
                Slug = product.Category.Slug,
                ImageUrl = product.Category.ImageUrl
            },
            IsActive = product.IsActive,
            IsFeatured = product.IsFeatured,
            CreatedAtUtc = product.CreatedAtUtc,
            UpdatedAtUtc = product.UpdatedAtUtc
        };

        return Ok(productDto);
    }

    /// <summary>
    /// Create a new product (Admin only).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = DbInitializer.AdminRole)]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null)
        {
            return BadRequest(new { message = $"Category with ID {dto.CategoryId} does not exist." });
        }

        var baseSlug = SlugHelper.GenerateSlug(dto.Name);
        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            return BadRequest(new { message = "Product name must produce a valid slug." });
        }

        // Ensure unique slug
        var uniqueSlug = baseSlug;
        int count = 1;
        while (await _context.Products.AnyAsync(p => p.Slug == uniqueSlug))
        {
            uniqueSlug = $"{baseSlug}-{count++}";
        }

        var product = new Product
        {
            Name = dto.Name.Trim(),
            Slug = uniqueSlug,
            Description = dto.Description.Trim(),
            Price = dto.Price,
            StockQuantity = dto.StockQuantity,
            ImageUrl = dto.ImageUrl,
            CategoryId = dto.CategoryId,
            IsFeatured = dto.IsFeatured,
            IsActive = dto.IsActive,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var resultDto = new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            ImageUrl = product.ImageUrl,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            IsActive = product.IsActive,
            IsFeatured = product.IsFeatured,
            CreatedAtUtc = product.CreatedAtUtc,
            UpdatedAtUtc = product.UpdatedAtUtc
        };

        _logger.LogInformation("Product created: {Name} (ID: {Id})", product.Name, product.Id);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, resultDto);
    }

    /// <summary>
    /// Update an existing product (Admin only).
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = DbInitializer.AdminRole)]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} was not found." });
        }

        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null)
        {
            return BadRequest(new { message = $"Category with ID {dto.CategoryId} does not exist." });
        }

        // Regenerate slug if name changed
        var baseSlug = SlugHelper.GenerateSlug(dto.Name);
        if (baseSlug != product.Slug)
        {
            var uniqueSlug = baseSlug;
            int count = 1;
            while (await _context.Products.AnyAsync(p => p.Slug == uniqueSlug && p.Id != id))
            {
                uniqueSlug = $"{baseSlug}-{count++}";
            }
            product.Slug = uniqueSlug;
        }

        product.Name = dto.Name.Trim();
        product.Description = dto.Description.Trim();
        product.Price = dto.Price;
        product.StockQuantity = dto.StockQuantity;
        product.ImageUrl = dto.ImageUrl;
        product.CategoryId = dto.CategoryId;
        product.IsFeatured = dto.IsFeatured;
        product.IsActive = dto.IsActive;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var resultDto = new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            ImageUrl = product.ImageUrl,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            IsActive = product.IsActive,
            IsFeatured = product.IsFeatured,
            CreatedAtUtc = product.CreatedAtUtc,
            UpdatedAtUtc = product.UpdatedAtUtc
        };

        _logger.LogInformation("Product updated: {Name} (ID: {Id})", product.Name, product.Id);
        return Ok(resultDto);
    }

    /// <summary>
    /// Soft deactivates a product (Admin only).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = DbInitializer.AdminRole)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} was not found." });
        }

        // Soft deactivation to preserve historical references/orders
        product.IsActive = false;
        product.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Product deactivated (soft deleted): {Name} (ID: {Id})", product.Name, product.Id);
        return NoContent();
    }
}
