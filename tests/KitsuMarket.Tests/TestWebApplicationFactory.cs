using KitsuMarket.API.Data;
using KitsuMarket.API.Data.Seed;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace KitsuMarket.Tests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private const string TestDbName = "KitsuMarketDb_Test";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            var testConfig = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Server=localhost;Database={TestDbName};Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true",
                ["Jwt:Key"] = "KitsuMarket_Test_Super_Secret_Jwt_Signing_Key_2026_MinLength256Bits!",
                ["Jwt:Issuer"] = "KitsuMarketAPI",
                ["Jwt:Audience"] = "KitsuMarketClient",
                ["AdminUser:Email"] = "admin@kitsumarket.com",
                ["AdminUser:Password"] = "Admin@KitsuMarket2026!",
                ["AdminUser:FullName"] = "Test Administrator"
            };

            config.AddInMemoryCollection(testConfig);
        });

        builder.ConfigureServices(services =>
        {
            // The default DbContext and DbInitializer will migrate and seed TestDbName automatically on startup
        });
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        await context.Database.EnsureDeletedAsync();
        await DbInitializer.SeedAsync(Services, config);
    }
}
