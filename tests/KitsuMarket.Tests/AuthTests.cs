using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using KitsuMarket.API.DTOs.Auth;
using Xunit;

namespace KitsuMarket.Tests;

public class AuthTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public AuthTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ValidCustomer_Returns201CreatedAndToken()
    {
        var registerDto = new RegisterRequestDto
        {
            FullName = "Taro Misaki",
            Email = $"taro_{Guid.NewGuid()}@example.com",
            Password = "SecurePassword123!",
            ConfirmPassword = "SecurePassword123!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.Equal(registerDto.Email, authResult.Email);
        Assert.Equal(registerDto.FullName, authResult.FullName);
        Assert.Contains("Customer", authResult.Roles);
        Assert.False(string.IsNullOrWhiteSpace(authResult.Token));
    }

    [Fact]
    public async Task Register_InvalidData_Returns400BadRequest()
    {
        // 1. Invalid email format
        var badEmailDto = new RegisterRequestDto
        {
            FullName = "Sakura",
            Email = "not-an-email",
            Password = "Password123!",
            ConfirmPassword = "Password123!"
        };
        var res1 = await _client.PostAsJsonAsync("/api/auth/register", badEmailDto);
        Assert.Equal(HttpStatusCode.BadRequest, res1.StatusCode);

        // 2. Mismatched passwords
        var mismatchDto = new RegisterRequestDto
        {
            FullName = "Sakura",
            Email = $"sakura_{Guid.NewGuid()}@example.com",
            Password = "Password123!",
            ConfirmPassword = "DifferentPassword456!"
        };
        var res2 = await _client.PostAsJsonAsync("/api/auth/register", mismatchDto);
        Assert.Equal(HttpStatusCode.BadRequest, res2.StatusCode);

        // 3. Short password
        var shortPassDto = new RegisterRequestDto
        {
            FullName = "Sakura",
            Email = $"sakura_{Guid.NewGuid()}@example.com",
            Password = "123",
            ConfirmPassword = "123"
        };
        var res3 = await _client.PostAsJsonAsync("/api/auth/register", shortPassDto);
        Assert.Equal(HttpStatusCode.BadRequest, res3.StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409Conflict()
    {
        var email = $"duplicate_{Guid.NewGuid()}@example.com";
        var registerDto = new RegisterRequestDto
        {
            FullName = "Duplicate Test",
            Email = email,
            Password = "SecurePassword123!",
            ConfirmPassword = "SecurePassword123!"
        };

        // First registration
        var firstResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

        // Duplicate registration
        var secondResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200OKAndToken()
    {
        var email = $"login_user_{Guid.NewGuid()}@example.com";
        var password = "LoginPassword123!";

        // Register first
        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = "Login User",
            Email = email,
            Password = password,
            ConfirmPassword = password
        });

        // Now login
        var loginDto = new LoginRequestDto
        {
            Email = email,
            Password = password
        };
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.Equal(email, authResult.Email);
        Assert.False(string.IsNullOrWhiteSpace(authResult.Token));
    }

    [Fact]
    public async Task Login_InvalidCredentials_Returns401Unauthorized()
    {
        var loginDto = new LoginRequestDto
        {
            Email = "nonexistent_user@example.com",
            Password = "WrongPassword999!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401Unauthorized()
    {
        using var clientWithoutAuth = _factory.CreateClient();
        var response = await clientWithoutAuth.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithValidCustomerToken_ReturnsUserProfileAndCustomerRole()
    {
        var email = $"me_test_{Guid.NewGuid()}@example.com";
        var regResponse = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequestDto
        {
            FullName = "Profile User",
            Email = email,
            Password = "ProfilePassword123!",
            ConfirmPassword = "ProfilePassword123!"
        });
        var authData = await regResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authData!.Token);

        var meResponse = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);

        var profile = await meResponse.Content.ReadFromJsonAsync<UserProfileDto>();
        Assert.NotNull(profile);
        Assert.Equal(email, profile.Email);
        Assert.Equal("Profile User", profile.FullName);
        Assert.Contains("Customer", profile.Roles);
        Assert.DoesNotContain("Admin", profile.Roles);
    }

    [Fact]
    public async Task Login_AdminUser_ReturnsAdminRole()
    {
        var loginDto = new LoginRequestDto
        {
            Email = "admin@kitsumarket.com",
            Password = "Admin@KitsuMarket2026!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(authResult);
        Assert.Contains("Admin", authResult.Roles);
    }
}
