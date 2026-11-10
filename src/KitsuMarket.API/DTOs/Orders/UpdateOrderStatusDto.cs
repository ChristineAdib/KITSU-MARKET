using System.ComponentModel.DataAnnotations;

namespace KitsuMarket.API.DTOs.Orders;

public class UpdateOrderStatusDto
{
    [Required(ErrorMessage = "Status is required.")]
    public string Status { get; set; } = string.Empty;
}
