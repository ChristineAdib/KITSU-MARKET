namespace KitsuMarket.API.Data.Entities;

public static class OrderStatus
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Processing = "Processing";
    public const string Shipped = "Shipped";
    public const string Delivered = "Delivered";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All =
    [
        Pending,
        Confirmed,
        Processing,
        Shipped,
        Delivered,
        Cancelled
    ];

    public static bool IsValid(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return false;

        return All.Any(s => string.Equals(s, status.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    public static string Normalize(string status)
    {
        var match = All.FirstOrDefault(s => string.Equals(s, status.Trim(), StringComparison.OrdinalIgnoreCase));
        return match ?? status;
    }
}
