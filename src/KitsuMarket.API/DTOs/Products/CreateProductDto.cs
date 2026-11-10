using System.ComponentModel.DataAnnotations;

namespace KitsuMarket.API.DTOs.Products;

public class CreateProductDto
{
    [Required(ErrorMessage = "Product name is required.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Product name must be between 2 and 200 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    [StringLength(2000, MinimumLength = 5, ErrorMessage = "Description must be between 5 and 2000 characters.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Price is required.")]
    [Range(0.01, 10000000.00, ErrorMessage = "Price must be greater than 0 EGP.")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Stock quantity is required.")]
    [Range(0, 1000000, ErrorMessage = "Stock quantity cannot be negative.")]
    public int StockQuantity { get; set; }

    [Required(ErrorMessage = "Image URL is required.")]
    [Url(ErrorMessage = "ImageUrl must be a valid URL.")]
    [StringLength(500, ErrorMessage = "ImageUrl must not exceed 500 characters.")]
    public string ImageUrl { get; set; } = string.Empty;

    [Required(ErrorMessage = "Category ID is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "A valid CategoryId is required.")]
    public int CategoryId { get; set; }

    public bool IsFeatured { get; set; } = false;
    public bool IsActive { get; set; } = true;
}
