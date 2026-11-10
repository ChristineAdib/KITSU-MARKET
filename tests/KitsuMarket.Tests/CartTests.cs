using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using KitsuMarket.API.DTOs.Auth;
using KitsuMarket.API.DTOs.Cart;
using KitsuMarket.API.DTOs.Common;
using KitsuMarket.API.DTOs.Products;
using Xunit;

namespace KitsuMarket.Tests;

public class CartTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public CartTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> CreateCustomerAndGetTokenAsync(string namePrefix = "CartUser")
    {
        var email = $"{namePrefix.ToLower()}_{Guid.NewGuid()}@example.com";
        var regResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = $"{namePrefix} Test",
            Email = email,
            Password = "Password123!",
            ConfirmPassword = "Password123!"
        });
        regResponse.EnsureSuccessStatusCode();
        var authResult = await regResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return authResult!.Token;
    }

    private async Task<ProductDto> GetAvailableProductAsync()
    {
        var response = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>("/api/products?pageSize=10");
        Assert.NotNull(response);
        return response.Items.First(p => p.StockQuantity >= 5 && p.IsActive);
    }

    [Fact]
    public async Task Cart_AddProduct_SucceedsAndCalculatesTotals()
    {
        var token = await CreateCustomerAndGetTokenAsync();
        var product = await GetAvailableProductAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto
            {
                ProductId = product.Id,
                Quantity = 2
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var cart = await response.Content.ReadFromJsonAsync<CartDto>();
        Assert.NotNull(cart);
        Assert.Single(cart.Items);
        Assert.Equal(2, cart.TotalItems);
        Assert.Equal(product.Price * 2, cart.TotalAmount);

        var item = cart.Items[0];
        Assert.Equal(product.Id, item.ProductId);
        Assert.Equal(2, item.Quantity);
        Assert.Equal(product.Price * 2, item.LineTotal);
        Assert.True(item.IsAvailable);
    }

    [Fact]
    public async Task Cart_IncreaseQuantity_ViaPostAndPut()
    {
        var token = await CreateCustomerAndGetTokenAsync();
        var product = await GetAvailableProductAsync();

        // 1. Add 1 item
        var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = product.Id, Quantity = 1 })
        };
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await _client.SendAsync(addReq);

        // 2. Add 1 more item via POST (increments quantity to 2)
        var incReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = product.Id, Quantity = 1 })
        };
        incReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var incRes = await _client.SendAsync(incReq);
        var cart1 = await incRes.Content.ReadFromJsonAsync<CartDto>();
        Assert.Equal(2, cart1!.Items[0].Quantity);

        // 3. Set quantity to 3 via PUT
        var putReq = new HttpRequestMessage(HttpMethod.Put, $"/api/cart/items/{product.Id}")
        {
            Content = JsonContent.Create(new UpdateCartItemRequestDto { Quantity = 3 })
        };
        putReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var putRes = await _client.SendAsync(putReq);
        var cart2 = await putRes.Content.ReadFromJsonAsync<CartDto>();
        Assert.Equal(3, cart2!.Items[0].Quantity);
        Assert.Equal(product.Price * 3, cart2.TotalAmount);
    }

    [Fact]
    public async Task Cart_DecreaseQuantity_ViaPut()
    {
        var token = await CreateCustomerAndGetTokenAsync();
        var product = await GetAvailableProductAsync();

        // Add 3 items
        var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = product.Id, Quantity = 3 })
        };
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await _client.SendAsync(addReq);

        // Decrease quantity to 1 via PUT
        var decReq = new HttpRequestMessage(HttpMethod.Put, $"/api/cart/items/{product.Id}")
        {
            Content = JsonContent.Create(new UpdateCartItemRequestDto { Quantity = 1 })
        };
        decReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var decRes = await _client.SendAsync(decReq);
        Assert.Equal(HttpStatusCode.OK, decRes.StatusCode);

        var cart = await decRes.Content.ReadFromJsonAsync<CartDto>();
        Assert.Equal(1, cart!.Items[0].Quantity);
        Assert.Equal(product.Price * 1, cart.TotalAmount);
    }

    [Fact]
    public async Task Cart_RemoveProduct_RemovesItemFromCart()
    {
        var token = await CreateCustomerAndGetTokenAsync();
        var product = await GetAvailableProductAsync();

        // Add item
        var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = product.Id, Quantity = 1 })
        };
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await _client.SendAsync(addReq);

        // Remove item
        var delReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/cart/items/{product.Id}");
        delReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var delRes = await _client.SendAsync(delReq);
        Assert.Equal(HttpStatusCode.OK, delRes.StatusCode);

        var cart = await delRes.Content.ReadFromJsonAsync<CartDto>();
        Assert.Empty(cart!.Items);
        Assert.Equal(0, cart.TotalItems);
        Assert.Equal(0m, cart.TotalAmount);
    }

    [Fact]
    public async Task Cart_ClearCart_RemovesAllItems()
    {
        var token = await CreateCustomerAndGetTokenAsync();
        var products = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>("/api/products?pageSize=2");
        Assert.NotNull(products);

        // Add 2 products
        foreach (var p in products.Items)
        {
            var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
            {
                Content = JsonContent.Create(new AddToCartRequestDto { ProductId = p.Id, Quantity = 1 })
            };
            addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            await _client.SendAsync(addReq);
        }

        // Clear cart
        var clearReq = new HttpRequestMessage(HttpMethod.Delete, "/api/cart");
        clearReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var clearRes = await _client.SendAsync(clearReq);
        Assert.Equal(HttpStatusCode.NoContent, clearRes.StatusCode);

        // Verify GET cart returns empty
        var getReq = new HttpRequestMessage(HttpMethod.Get, "/api/cart");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var getRes = await _client.SendAsync(getReq);
        var cart = await getRes.Content.ReadFromJsonAsync<CartDto>();
        Assert.Empty(cart!.Items);
    }

    [Fact]
    public async Task Cart_AddUnavailableOrNonexistentProduct_Returns400()
    {
        var token = await CreateCustomerAndGetTokenAsync();

        var badReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = 999999, Quantity = 1 })
        };
        badReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(badReq);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Cart_ExceedingStock_Returns400()
    {
        var token = await CreateCustomerAndGetTokenAsync();
        var product = await GetAvailableProductAsync();

        var req = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto
            {
                ProductId = product.Id,
                Quantity = product.StockQuantity + 100
            })
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(req);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Cart_CustomerIsolation_CustomerACannotSeeCustomerBCart()
    {
        var tokenA = await CreateCustomerAndGetTokenAsync("UserA");
        var tokenB = await CreateCustomerAndGetTokenAsync("UserB");
        var product = await GetAvailableProductAsync();

        // Customer A adds product
        var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = product.Id, Quantity = 2 })
        };
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);
        await _client.SendAsync(addReq);

        // Customer B checks cart
        var getReqB = new HttpRequestMessage(HttpMethod.Get, "/api/cart");
        getReqB.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenB);
        var resB = await _client.SendAsync(getReqB);
        var cartB = await resB.Content.ReadFromJsonAsync<CartDto>();

        // Customer B's cart must be empty
        Assert.NotNull(cartB);
        Assert.Empty(cartB.Items);
        Assert.Equal(0, cartB.TotalItems);
    }
}
