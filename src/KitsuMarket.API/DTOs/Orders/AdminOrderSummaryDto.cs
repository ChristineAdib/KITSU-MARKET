namespace KitsuMarket.API.DTOs.Orders;

public class AdminOrderSummaryDto : OrderSummaryDto
{
    public string UserId { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerFullName { get; set; } = string.Empty;
    public string ShippingFullName { get; set; } = string.Empty;
}
