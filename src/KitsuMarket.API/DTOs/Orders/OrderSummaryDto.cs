namespace KitsuMarket.API.DTOs.Orders;

public class OrderSummaryDto
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int TotalItems { get; set; }
    public string ShippingCity { get; set; } = string.Empty;
}
