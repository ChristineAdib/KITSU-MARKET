using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace KitsuMarket.API.DTOs.Products;

public class UploadProductImageDto
{
    [Required(ErrorMessage = "Image file is required.")]
    public IFormFile File { get; set; } = null!;
}
