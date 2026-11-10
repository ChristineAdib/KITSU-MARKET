using System.ComponentModel.DataAnnotations;

namespace KitsuMarket.API.DTOs.Orders;

public class CreateOrderRequestDto
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters.")]
    public string ShippingFullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [StringLength(30, MinimumLength = 6, ErrorMessage = "Phone number must be between 6 and 30 characters.")]
    [Phone(ErrorMessage = "Please provide a valid phone number.")]
    public string ShippingPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Shipping address is required.")]
    [StringLength(250, MinimumLength = 5, ErrorMessage = "Shipping address must be between 5 and 250 characters.")]
    public string ShippingAddress { get; set; } = string.Empty;

    [Required(ErrorMessage = "City is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "City must be between 2 and 100 characters.")]
    public string ShippingCity { get; set; } = string.Empty;
}
