namespace KitsuMarket.API.DTOs.Products;

public class ProductQueryParameters
{
    private const int MaxPageSize = 50;
    private int _pageSize = 10;
    private int _page = 1;

    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsFeatured { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; }

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 10 : value);
    }
}
