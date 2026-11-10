using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using KitsuMarket.API.DTOs.Auth;
using KitsuMarket.API.DTOs.Categories;
using Xunit;

namespace KitsuMarket.Tests;

public class CategoryTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public CategoryTests(TestWebApplicationFactory factory)
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

    [Fact]
    public async Task GetAllCategories_PublicAccess_ReturnsSeededCategories()
    {
        var response = await _client.GetAsync("/api/categories");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(categories);
        Assert.True(categories.Count >= 5);
        Assert.Contains(categories, c => c.Slug == "figures");
        Assert.Contains(categories, c => c.Slug == "manga");
    }

    [Fact]
    public async Task Admin_CanCreateUpdateAndDeleteEmptyCategory()
    {
        var adminToken = await GetAdminTokenAsync();

        // 1. Create Category
        var createDto = new CreateCategoryDto
        {
            Name = $"Collectible Pins {Guid.NewGuid().ToString().Substring(0, 8)}",
            ImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
        };

        var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/categories")
        {
            Content = JsonContent.Create(createDto)
        };
        createReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var createRes = await _client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        var createdCat = await createRes.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(createdCat);
        Assert.Equal(createDto.Name, createdCat.Name);

        // 2. Update Category
        var updateDto = new UpdateCategoryDto
        {
            Name = $"{createDto.Name} Updated",
            ImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
        };
        var updateReq = new HttpRequestMessage(HttpMethod.Put, $"/api/categories/{createdCat.Id}")
        {
            Content = JsonContent.Create(updateDto)
        };
        updateReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var updateRes = await _client.SendAsync(updateReq);
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

        // 3. Delete Category (empty category can be deleted)
        var deleteReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/categories/{createdCat.Id}");
        deleteReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var deleteRes = await _client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

        // Verify it was deleted
        var getRes = await _client.GetAsync($"/api/categories/{createdCat.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }

    [Fact]
    public async Task Admin_CannotDeleteCategoryWithProducts_Returns409Conflict()
    {
        var adminToken = await GetAdminTokenAsync();

        // Figures category has products
        var categories = await _client.GetFromJsonAsync<List<CategoryDto>>("/api/categories");
        Assert.NotNull(categories);
        var figuresCat = categories.First(c => c.Slug == "figures");

        var deleteReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/categories/{figuresCat.Id}");
        deleteReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var deleteRes = await _client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.Conflict, deleteRes.StatusCode);
    }
}
