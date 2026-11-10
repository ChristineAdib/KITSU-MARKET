using System.ComponentModel.DataAnnotations;

namespace KitsuMarket.API.DTOs.Cart;

public class UpdateCartItemRequestDto
{
    [Required(ErrorMessage = "Quantity is required.")]
    [Range(1, 1000, ErrorMessage = "Quantity must be between 1 and 1000.")]
    public int Quantity { get; set; }
}
