using System.ComponentModel.DataAnnotations;

namespace KitsuMarket.API.DTOs.Categories;

public class CreateCategoryDto
{
    [Required(ErrorMessage = "Category name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Category name must be between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Url(ErrorMessage = "ImageUrl must be a valid URL.")]
    [StringLength(500, ErrorMessage = "ImageUrl must not exceed 500 characters.")]
    public string? ImageUrl { get; set; }
}
