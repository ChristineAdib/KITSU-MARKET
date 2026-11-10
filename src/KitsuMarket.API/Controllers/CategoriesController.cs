using KitsuMarket.API.Common;
using KitsuMarket.API.Data;
using KitsuMarket.API.Data.Entities;
using KitsuMarket.API.Data.Seed;
using KitsuMarket.API.DTOs.Categories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KitsuMarket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(ApplicationDbContext context, ILogger<CategoriesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all categories (Public).
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        return Ok(categories);
    }

    /// <summary>
    /// Get category by ID (Public).
    /// </summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                ImageUrl = c.ImageUrl,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .FirstOrDefaultAsync();

        if (category == null)
        {
            return NotFound(new { message = $"Category with ID {id} was not found." });
        }

        return Ok(category);
    }

    /// <summary>
    /// Create a new category (Admin only).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = DbInitializer.AdminRole)]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        var baseSlug = SlugHelper.GenerateSlug(dto.Name);
        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            return BadRequest(new { message = "Category name must generate a valid slug." });
        }

        var slugExists = await _context.Categories.AnyAsync(c => c.Slug == baseSlug);
        if (slugExists)
        {
            return Conflict(new { message = $"A category with slug '{baseSlug}' already exists." });
        }

        var category = new Category
        {
            Name = dto.Name.Trim(),
            Slug = baseSlug,
            ImageUrl = dto.ImageUrl
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var resultDto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            ImageUrl = category.ImageUrl,
            ProductCount = 0
        };

        _logger.LogInformation("Category created: {Name} (ID: {Id})", category.Name, category.Id);
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, resultDto);
    }

    /// <summary>
    /// Update an existing category (Admin only).
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = DbInitializer.AdminRole)]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound(new { message = $"Category with ID {id} was not found." });
        }

        var newSlug = SlugHelper.GenerateSlug(dto.Name);
        if (newSlug != category.Slug)
        {
            var slugExists = await _context.Categories.AnyAsync(c => c.Slug == newSlug && c.Id != id);
            if (slugExists)
            {
                return Conflict(new { message = $"Another category with slug '{newSlug}' already exists." });
            }
            category.Slug = newSlug;
        }

        category.Name = dto.Name.Trim();
        category.ImageUrl = dto.ImageUrl;

        await _context.SaveChangesAsync();

        var productCount = await _context.Products.CountAsync(p => p.CategoryId == id && p.IsActive);

        var resultDto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            ImageUrl = category.ImageUrl,
            ProductCount = productCount
        };

        _logger.LogInformation("Category updated: {Name} (ID: {Id})", category.Name, category.Id);
        return Ok(resultDto);
    }

    /// <summary>
    /// Delete a category if it has no associated products (Admin only).
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = DbInitializer.AdminRole)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound(new { message = $"Category with ID {id} was not found." });
        }

        if (category.Products.Any())
        {
            return Conflict(new
            {
                message = "Cannot delete category because it has products associated with it. Please reassign or delete the products first."
            });
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Category deleted: {Id}", id);
        return NoContent();
    }
}
