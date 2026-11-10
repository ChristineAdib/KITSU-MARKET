using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using KitsuMarket.API.Data.Entities;
using KitsuMarket.API.DTOs.Auth;
using KitsuMarket.API.DTOs.Cart;
using KitsuMarket.API.DTOs.Common;
using KitsuMarket.API.DTOs.Orders;
using KitsuMarket.API.DTOs.Products;
using Xunit;

namespace KitsuMarket.Tests;

public class OrderTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public OrderTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> CreateCustomerAndGetTokenAsync(string namePrefix = "OrderUser")
    {
        var email = $"{namePrefix.ToLower()}_{Guid.NewGuid()}@example.com";
        var regResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = $"{namePrefix} Customer",
            Email = email,
            Password = "Password123!",
            ConfirmPassword = "Password123!"
        });
        regResponse.EnsureSuccessStatusCode();
        var authResult = await regResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        return authResult!.Token;
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

    private async Task<ProductDto> GetAvailableProductAsync()
    {
        var response = await _client.GetFromJsonAsync<PagedResultDto<ProductDto>>("/api/products?pageSize=10");
        Assert.NotNull(response);
        return response.Items.First(p => p.StockQuantity >= 5 && p.IsActive);
    }

    [Fact]
    public async Task Checkout_SuccessfulFlow_CreatesOrder_ReducesStock_ClearsCart()
    {
        var token = await CreateCustomerAndGetTokenAsync();
        var product = await GetAvailableProductAsync();
        var originalStock = product.StockQuantity;
        var purchaseQuantity = 2;

        // 1. Add item to cart
        var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto
            {
                ProductId = product.Id,
                Quantity = purchaseQuantity
            })
        };
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var addRes = await _client.SendAsync(addReq);
        Assert.Equal(HttpStatusCode.OK, addRes.StatusCode);

        // 2. Checkout
        var checkoutDto = new CreateOrderRequestDto
        {
            ShippingFullName = "Hinata Hyuga",
            ShippingPhone = "+201012345678",
            ShippingAddress = "12 Leaf Village Way, Sector 4",
            ShippingCity = "Cairo"
        };
        var orderReq = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(checkoutDto)
        };
        orderReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var orderRes = await _client.SendAsync(orderReq);
        Assert.Equal(HttpStatusCode.Created, orderRes.StatusCode);

        var order = await orderRes.Content.ReadFromJsonAsync<OrderDetailsDto>();
        Assert.NotNull(order);
        Assert.StartsWith("KM-", order.OrderNumber);
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Equal(product.Price * purchaseQuantity, order.TotalAmount);
        Assert.Equal(purchaseQuantity, order.TotalItems);
        Assert.Single(order.Items);
        Assert.Equal(checkoutDto.ShippingFullName, order.ShippingFullName);

        // Verify OrderItem snapshot
        var itemSnapshot = order.Items[0];
        Assert.Equal(product.Id, itemSnapshot.ProductId);
        Assert.Equal(product.Name, itemSnapshot.ProductName);
        Assert.Equal(product.Price, itemSnapshot.UnitPrice);
        Assert.Equal(purchaseQuantity, itemSnapshot.Quantity);
        Assert.Equal(product.Price * purchaseQuantity, itemSnapshot.LineTotal);

        // 3. Verify stock was reduced
        var updatedProduct = await _client.GetFromJsonAsync<ProductDetailsDto>($"/api/products/{product.Id}");
        Assert.NotNull(updatedProduct);
        Assert.Equal(originalStock - purchaseQuantity, updatedProduct.StockQuantity);

        // 4. Verify cart was cleared
        var getCartReq = new HttpRequestMessage(HttpMethod.Get, "/api/cart");
        getCartReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var cartRes = await _client.SendAsync(getCartReq);
        var cart = await cartRes.Content.ReadFromJsonAsync<CartDto>();
        Assert.Empty(cart!.Items);

        // 5. Verify customer order history
        var historyReq = new HttpRequestMessage(HttpMethod.Get, "/api/orders/my-orders");
        historyReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var historyRes = await _client.SendAsync(historyReq);
        Assert.Equal(HttpStatusCode.OK, historyRes.StatusCode);

        var ordersList = await historyRes.Content.ReadFromJsonAsync<List<OrderSummaryDto>>();
        Assert.NotNull(ordersList);
        Assert.Contains(ordersList, o => o.OrderNumber == order.OrderNumber);

        // 6. Verify single order retrieval
        var getOrderReq = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/{order.Id}");
        getOrderReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var singleOrderRes = await _client.SendAsync(getOrderReq);
        Assert.Equal(HttpStatusCode.OK, singleOrderRes.StatusCode);
    }

    [Fact]
    public async Task Checkout_EmptyCart_Returns400()
    {
        var token = await CreateCustomerAndGetTokenAsync();

        var checkoutDto = new CreateOrderRequestDto
        {
            ShippingFullName = "Empty Cart Test",
            ShippingPhone = "+201098765432",
            ShippingAddress = "10 Desert Road",
            ShippingCity = "Alexandria"
        };
        var orderReq = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(checkoutDto)
        };
        orderReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var orderRes = await _client.SendAsync(orderReq);
        Assert.Equal(HttpStatusCode.BadRequest, orderRes.StatusCode);
    }

    [Fact]
    public async Task Checkout_InsufficientStock_RollsBackTransaction_NoOrderCreated_NoStockChanged()
    {
        var tokenCustomer1 = await CreateCustomerAndGetTokenAsync("UserOne");
        var tokenCustomer2 = await CreateCustomerAndGetTokenAsync("UserTwo");
        var product = await GetAvailableProductAsync();
        var stockBefore = product.StockQuantity;

        // Customer 1 adds all remaining stock
        var addReq1 = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto
            {
                ProductId = product.Id,
                Quantity = stockBefore
            })
        };
        addReq1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenCustomer1);
        await _client.SendAsync(addReq1);

        // Customer 2 also adds all remaining stock
        var addReq2 = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto
            {
                ProductId = product.Id,
                Quantity = stockBefore
            })
        };
        addReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenCustomer2);
        await _client.SendAsync(addReq2);

        // Customer 1 checks out successfully (takes all stock)
        var orderReq1 = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new CreateOrderRequestDto
            {
                ShippingFullName = "Fast Customer",
                ShippingPhone = "+201000000001",
                ShippingAddress = "1 Speed Avenue",
                ShippingCity = "Giza"
            })
        };
        orderReq1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenCustomer1);
        var orderRes1 = await _client.SendAsync(orderReq1);
        Assert.Equal(HttpStatusCode.Created, orderRes1.StatusCode);

        // Product stock is now 0
        var productAfter = await _client.GetFromJsonAsync<ProductDetailsDto>($"/api/products/{product.Id}");
        Assert.Equal(0, productAfter!.StockQuantity);

        // Customer 2 tries to checkout with outdated stock
        var orderReq2 = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new CreateOrderRequestDto
            {
                ShippingFullName = "Slow Customer",
                ShippingPhone = "+201000000002",
                ShippingAddress = "2 Slow Lane",
                ShippingCity = "Giza"
            })
        };
        orderReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenCustomer2);
        var orderRes2 = await _client.SendAsync(orderReq2);

        // Must fail with 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, orderRes2.StatusCode);

        // Stock must still be 0 (no negative stock!)
        var productFinal = await _client.GetFromJsonAsync<ProductDetailsDto>($"/api/products/{product.Id}");
        Assert.Equal(0, productFinal!.StockQuantity);

        // Customer 2's order history must NOT contain any order
        var historyReq2 = new HttpRequestMessage(HttpMethod.Get, "/api/orders/my-orders");
        historyReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenCustomer2);
        var historyRes2 = await _client.SendAsync(historyReq2);
        var historyList2 = await historyRes2.Content.ReadFromJsonAsync<List<OrderSummaryDto>>();
        Assert.Empty(historyList2!);
    }

    [Fact]
    public async Task CustomerA_CannotViewCustomerB_Order_Returns404()
    {
        var tokenA = await CreateCustomerAndGetTokenAsync("OwnerA");
        var tokenB = await CreateCustomerAndGetTokenAsync("IntruderB");
        var product = await GetAvailableProductAsync();

        // Customer A buys product
        var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = product.Id, Quantity = 1 })
        };
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);
        await _client.SendAsync(addReq);

        var checkoutReq = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new CreateOrderRequestDto
            {
                ShippingFullName = "Owner A",
                ShippingPhone = "+201122334455",
                ShippingAddress = "A Street",
                ShippingCity = "Cairo"
            })
        };
        checkoutReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenA);
        var checkoutRes = await _client.SendAsync(checkoutReq);
        var orderA = await checkoutRes.Content.ReadFromJsonAsync<OrderDetailsDto>();

        // Customer B attempts to view Customer A's order by changing the ID
        var intruderReq = new HttpRequestMessage(HttpMethod.Get, $"/api/orders/{orderA!.Id}");
        intruderReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenB);
        var intruderRes = await _client.SendAsync(intruderReq);

        Assert.Equal(HttpStatusCode.NotFound, intruderRes.StatusCode);
    }

    [Fact]
    public async Task Customer_CannotAccessAdminOrders_Returns403Forbidden()
    {
        var customerToken = await CreateCustomerAndGetTokenAsync();

        var adminOrdersReq = new HttpRequestMessage(HttpMethod.Get, "/api/admin/orders");
        adminOrdersReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);
        var response = await _client.SendAsync(adminOrdersReq);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_CanViewOrders_AndManageOrderStatus()
    {
        var adminToken = await GetAdminTokenAsync();
        var customerToken = await CreateCustomerAndGetTokenAsync("OrderForAdmin");
        var product = await GetAvailableProductAsync();

        // Customer creates order
        var addReq = new HttpRequestMessage(HttpMethod.Post, "/api/cart/items")
        {
            Content = JsonContent.Create(new AddToCartRequestDto { ProductId = product.Id, Quantity = 1 })
        };
        addReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);
        await _client.SendAsync(addReq);

        var checkoutReq = new HttpRequestMessage(HttpMethod.Post, "/api/orders")
        {
            Content = JsonContent.Create(new CreateOrderRequestDto
            {
                ShippingFullName = "Admin Managed Customer",
                ShippingPhone = "+201555555555",
                ShippingAddress = "10 Admin Lane",
                ShippingCity = "Cairo"
            })
        };
        checkoutReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);
        var checkoutRes = await _client.SendAsync(checkoutReq);
        var order = await checkoutRes.Content.ReadFromJsonAsync<OrderDetailsDto>();

        // Admin lists orders
        var listReq = new HttpRequestMessage(HttpMethod.Get, "/api/admin/orders");
        listReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var listRes = await _client.SendAsync(listReq);
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

        var pagedResult = await listRes.Content.ReadFromJsonAsync<PagedResultDto<AdminOrderSummaryDto>>();
        Assert.NotNull(pagedResult);
        Assert.Contains(pagedResult.Items, o => o.OrderNumber == order!.OrderNumber);

        // Admin gets specific order details
        var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/admin/orders/{order!.Id}");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var getRes = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);

        var adminOrderDetails = await getRes.Content.ReadFromJsonAsync<AdminOrderDetailsDto>();
        Assert.NotNull(adminOrderDetails);
        Assert.False(string.IsNullOrWhiteSpace(adminOrderDetails.CustomerEmail));

        // Admin updates status to Confirmed
        var patchReq1 = new HttpRequestMessage(HttpMethod.Patch, $"/api/admin/orders/{order.Id}/status")
        {
            Content = JsonContent.Create(new UpdateOrderStatusDto { Status = OrderStatus.Confirmed })
        };
        patchReq1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var patchRes1 = await _client.SendAsync(patchReq1);
        Assert.Equal(HttpStatusCode.OK, patchRes1.StatusCode);

        var updatedOrder1 = await patchRes1.Content.ReadFromJsonAsync<AdminOrderDetailsDto>();
        Assert.Equal(OrderStatus.Confirmed, updatedOrder1!.Status);

        // Admin updates status to Shipped
        var patchReq2 = new HttpRequestMessage(HttpMethod.Patch, $"/api/admin/orders/{order.Id}/status")
        {
            Content = JsonContent.Create(new UpdateOrderStatusDto { Status = OrderStatus.Shipped })
        };
        patchReq2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var patchRes2 = await _client.SendAsync(patchReq2);
        Assert.Equal(HttpStatusCode.OK, patchRes2.StatusCode);

        var updatedOrder2 = await patchRes2.Content.ReadFromJsonAsync<AdminOrderDetailsDto>();
        Assert.Equal(OrderStatus.Shipped, updatedOrder2!.Status);

        // Admin rejects invalid status
        var badPatchReq = new HttpRequestMessage(HttpMethod.Patch, $"/api/admin/orders/{order.Id}/status")
        {
            Content = JsonContent.Create(new UpdateOrderStatusDto { Status = "InvalidStatus123" })
        };
        badPatchReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var badPatchRes = await _client.SendAsync(badPatchReq);
        Assert.Equal(HttpStatusCode.BadRequest, badPatchRes.StatusCode);
    }
}
