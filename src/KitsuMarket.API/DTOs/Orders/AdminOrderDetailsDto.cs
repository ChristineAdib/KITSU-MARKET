namespace KitsuMarket.API.DTOs.Orders;

public class AdminOrderDetailsDto : OrderDetailsDto
{
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerFullName { get; set; } = string.Empty;
}
