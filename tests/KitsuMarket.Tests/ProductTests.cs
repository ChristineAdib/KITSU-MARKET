using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using KitsuMarket.API.DTOs.Auth;
using KitsuMarket.API.DTOs.Categories;
using KitsuMarket.API.DTOs.Common;
using KitsuMarket.API.DTOs.Products;
using Xunit;

namespace KitsuMarket.Tests;

public class ProductTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public ProductTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
        {
            Email = "admin@kitsumarket.com",
            Password = "Admin@KitsuMarket2026!"
        });
        loginResponse.EnsureSuccessStatusCode();
        var authResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return authResult!.Token;
    }

    private async Task<string> GetCustomerTokenAsync()
    {
        var email = $"customer_{Guid.NewGuid()}@example.com";
        var regResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = "Customer Test",
            Email = email,
            Password = "CustomerPassword123!",
            ConfirmPassword = "CustomerPassword123!"
        });
        regResponse.EnsureSuccessStatusCode();
        var authResult = await regResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return authResult!.Token;
    }

    [Fact]
    public async Task GetProducts_PublicAccess_ReturnsSeededProducts()
    {
        var response = await _client.GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<PagedResultDto<ProductDto>>();
        Assert.NotNull(result);
        Assert.True(result.TotalCount >= 10);
        Assert.NotEmpty(result.Items);
        Assert.All(result.Items, p => Assert.True(p.IsActive));
    }

    [Fact]
    public async Task GetProductById_PublicAccess_ReturnsProductDetails()
    {
        // Get list first
        var listResponse = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>("/api/products?pageSize=1");
        Assert.NotNull(listResponse);
        var firstProduct = listResponse.Items[0];

        var response = await _client.GetAsync($"/api/products/{firstProduct.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var details = await response.Content.ReadFromJsonAsync<ProductDetailsDto>();
        Assert.NotNull(details);
        Assert.Equal(firstProduct.Id, details.Id);
        Assert.Equal(firstProduct.Name, details.Name);
        Assert.NotNull(details.Category);
    }

    [Fact]
    public async Task CreateProduct_ByAnonymousOrCustomer_ReturnsUnauthorizedOrForbidden()
    {
        var createDto = new CreateProductDto
        {
            Name = "Unauthorized Figure",
            Description = "Should be rejected without admin role",
            Price = 1200.00m,
            StockQuantity = 5,
            ImageUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f",
            CategoryId = 1
        };

        // 1. Anonymous -> 401 Unauthorized
        var anonResponse = await _client.PostAsJsonAsync("/api/products", createDto);
        Assert.Equal(HttpStatusCode.Unauthorized, anonResponse.StatusCode);

        // 2. Customer -> 403 Forbidden
        var customerToken = await GetCustomerTokenAsync();
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/products")
        {
            Content = JsonContent.Create(createDto)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);

        var customerResponse = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, customerResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_CanManageProduct_CreateUpdateDeactivate()
    {
        var adminToken = await GetAdminTokenAsync();

        // 1. Create Product
        var createDto = new CreateProductDto
        {
            Name = $"Test Hero Figure {Guid.NewGuid()}",
            Description = "Exclusive prototype test anime figure.",
            Price = 1750.50m,
            StockQuantity = 25,
            ImageUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f",
            CategoryId = 1,
            IsFeatured = true,
            IsActive = true
        };

        var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/products")
        {
            Content = JsonContent.Create(createDto)
        };
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var createResponse = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdProduct = await createResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(createdProduct);
        Assert.Equal(createDto.Name, createdProduct.Name);
        Assert.Equal(1750.50m, createdProduct.Price);
        Assert.True(createdProduct.Id > 0);

        // 2. Update Product
        var updateDto = new UpdateProductDto
        {
            Name = $"{createDto.Name} Updated Edition",
            Description = "Updated prototype description with extra accessories.",
            Price = 1999.00m,
            StockQuantity = 30,
            ImageUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f",
            CategoryId = 1,
            IsFeatured = false,
            IsActive = true
        };

        var updateReq = new HttpRequestMessage(HttpMethod.Put, $"/api/products/{createdProduct.Id}")
        {
            Content = JsonContent.Create(updateDto)
        };
        updateReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var updateResponse = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updatedProduct = await updateResponse.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(updatedProduct);
        Assert.Equal(updateDto.Name, updatedProduct.Name);
        Assert.Equal(1999.00m, updatedProduct.Price);
        Assert.NotNull(updatedProduct.UpdatedAtUtc);

        // 3. Deactivate Product (Soft Delete)
        var deleteReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/products/{createdProduct.Id}");
        deleteReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var deleteResponse = await _client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Verify public cannot access deactivated product (returns 404)
        var publicCheck = await _client.GetAsync($"/api/products/{createdProduct.Id}");
        Assert.Equal(HttpStatusCode.NotFound, publicCheck.StatusCode);
    }

    [Fact]
    public async Task FilterAndSearch_WorksCorrectly()
    {
        // 1. Search by name
        var searchResponse = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>("/api/products?search=Ren");
        Assert.NotNull(searchResponse);
        Assert.True(searchResponse.TotalCount >= 1);
        Assert.All(searchResponse.Items, p =>
            Assert.True(p.Name.Contains("Ren", StringComparison.OrdinalIgnoreCase) ||
                        p.Description.Contains("Ren", StringComparison.OrdinalIgnoreCase)));

        // 2. Filter by category (e.g. Manga, categoryId 5 or checking categories endpoint)
        var categories = await _client.GetFromJsonAsync<List<CategoryDto>>("/api/categories");
        Assert.NotNull(categories);
        var mangaCat = categories.First(c => c.Slug == "manga");

        var mangaProducts = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>($"/api/products?categoryId={mangaCat.Id}");
        Assert.NotNull(mangaProducts);
        Assert.All(mangaProducts.Items, p => Assert.Equal(mangaCat.Id, p.CategoryId));

        // 3. Filter by price range
        var priceFiltered = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>("/api/products?minPrice=200&maxPrice=500");
        Assert.NotNull(priceFiltered);
        Assert.All(priceFiltered.Items, p =>
        {
            Assert.True(p.Price >= 200m);
            Assert.True(p.Price <= 500m);
        });

        // 4. Sorting by price descending
        var sorted = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>("/api/products?sortBy=price_desc&pageSize=10");
        Assert.NotNull(sorted);
        for (int i = 0; i < sorted.Items.Count - 1; i++)
        {
            Assert.True(sorted.Items[i].Price >= sorted.Items[i + 1].Price);
        }
    }
}
