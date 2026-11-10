using KitsuMarket.API.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitsuMarket.API.Data.Seed;

public static class DbInitializer
{
    public const string AdminRole = "Admin";
    public const string CustomerRole = "Customer";

    public static async Task SeedAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbInitializer");

        // Apply pending migrations automatically on startup
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }

        // 1. Seed Roles
        string[] roles = [AdminRole, CustomerRole];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created role: {Role}", role);
            }
        }

        // 2. Seed Development Admin if configured
        var adminEmail = configuration["AdminUser:Email"];
        var adminPassword = configuration["AdminUser:Password"];
        var adminFullName = configuration["AdminUser:FullName"] ?? "System Administrator";

        if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
        {
            var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
            if (existingAdmin == null)
            {
                var adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = adminFullName,
                    EmailConfirmed = true,
                    CreatedAtUtc = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(adminUser, adminPassword);
                if (createResult.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, AdminRole);
                    logger.LogInformation("Seeded initial Admin user: {Email}", adminEmail);
                }
                else
                {
                    logger.LogWarning("Failed to seed Admin user: {Errors}",
                        string.Join(", ", createResult.Errors.Select(e => e.Description)));
                }
            }
            else
            {
                if (!await userManager.IsInRoleAsync(existingAdmin, AdminRole))
                {
                    await userManager.AddToRoleAsync(existingAdmin, AdminRole);
                }
            }
        }

        // 3. Seed Categories if none exist
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new()
                {
                    Name = "Figures",
                    Slug = "figures",
                    ImageUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80"
                },
                new()
                {
                    Name = "Apparel",
                    Slug = "apparel",
                    ImageUrl = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80"
                },
                new()
                {
                    Name = "Accessories",
                    Slug = "accessories",
                    ImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
                },
                new()
                {
                    Name = "Posters",
                    Slug = "posters",
                    ImageUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80"
                },
                new()
                {
                    Name = "Manga",
                    Slug = "manga",
                    ImageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
                }
            };

            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} categories.", categories.Count);
        }

        // 4. Seed Products if none exist
        if (!await context.Products.AnyAsync())
        {
            var figuresCategory = await context.Categories.FirstAsync(c => c.Slug == "figures");
            var apparelCategory = await context.Categories.FirstAsync(c => c.Slug == "apparel");
            var accessoriesCategory = await context.Categories.FirstAsync(c => c.Slug == "accessories");
            var postersCategory = await context.Categories.FirstAsync(c => c.Slug == "posters");
            var mangaCategory = await context.Categories.FirstAsync(c => c.Slug == "manga");

            var products = new List<Product>
            {
                new()
                {
                    Name = "Kitsu Guardian Ren 1/7 Scale Masterpiece Resin Figure",
                    Slug = "kitsu-guardian-ren-1-7-scale-masterpiece-resin-figure",
                    Description = "A meticulously crafted 1/7 scale collector resin figure of Ren, the Fox Shrine Sentinel, featuring dynamic flame aura effects and cherry blossom base.",
                    Price = 2850.00m,
                    StockQuantity = 15,
                    ImageUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Astra Mecha Unit-09 Heavy Armor Display Figure",
                    Slug = "astra-mecha-unit-09-heavy-armor-display-figure",
                    Description = "Articulated mechanical warrior figure featuring metallic titanium finish, dual ion blades, and customizable posture joints.",
                    Price = 3200.00m,
                    StockQuantity = 8,
                    ImageUrl = "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Cyber Shinobi Kanji Embroidered Oversized Hoodie",
                    Slug = "cyber-shinobi-kanji-embroidered-oversized-hoodie",
                    Description = "Heavyweight 400 GSM organic cotton streetwear hoodie with cybernetic fox embroidery and drop-shoulder relaxed silhouette.",
                    Price = 950.00m,
                    StockQuantity = 40,
                    ImageUrl = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
                    CategoryId = apparelCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Neo Tokyo Midnight Racing Graphic Tee",
                    Slug = "neo-tokyo-midnight-racing-graphic-tee",
                    Description = "Vintage washed streetwear t-shirt featuring futuristic neon highway artwork and retro Japanese typography.",
                    Price = 480.00m,
                    StockQuantity = 65,
                    ImageUrl = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
                    CategoryId = apparelCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Spirit Fox Inari Enamel Keyring Charm",
                    Slug = "spirit-fox-inari-enamel-keyring-charm",
                    Description = "Gold-plated hard enamel keychain with two-tone crimson tassels and translucent stained-glass enamel lacquer.",
                    Price = 180.00m,
                    StockQuantity = 120,
                    ImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
                    CategoryId = accessoriesCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Starlight Katana Desk Mat & Gaming Mousepad",
                    Slug = "starlight-katana-desk-mat-gaming-mousepad",
                    Description = "900x400mm waterproof micro-weave surface with non-slip rubber base and edge stitching depicting celestial sword strokes.",
                    Price = 420.00m,
                    StockQuantity = 50,
                    ImageUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
                    CategoryId = accessoriesCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Neo Kyoto Sunset Metallic Foil Art Print",
                    Slug = "neo-kyoto-sunset-metallic-foil-art-print",
                    Description = "A2 museum-grade archival matte paper print with hot-stamped holographic gold foil accents showcasing cybernetic pagoda vistas.",
                    Price = 350.00m,
                    StockQuantity = 75,
                    ImageUrl = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
                    CategoryId = postersCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Valkyrie Squadron Retro Mech Propaganda Poster",
                    Slug = "valkyrie-squadron-retro-mech-propaganda-poster",
                    Description = "Lithographic print with distressed vintage textures and bold constructivist anime aerial combat illustrations.",
                    Price = 280.00m,
                    StockQuantity = 90,
                    ImageUrl = "https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?w=600&auto=format&fit=crop&q=80",
                    CategoryId = postersCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Chronicles of the Star Fox: Volume 1 (Special Edition)",
                    Slug = "chronicles-of-the-star-fox-volume-1-special-edition",
                    Description = "Original illustrated space-fantasy manga volume featuring 220 pages, bonus colored dust jacket, and character sketch art book.",
                    Price = 260.00m,
                    StockQuantity = 110,
                    ImageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
                    CategoryId = mangaCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Blade of Twilight: Omnibus Collection Vol. 1-3",
                    Slug = "blade-of-twilight-omnibus-collection-vol-1-3",
                    Description = "Deluxe hardcover omnibus collecting the epic dark supernatural samurai saga with gilded page edges and author commentary.",
                    Price = 590.00m,
                    StockQuantity = 35,
                    ImageUrl = "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
                    CategoryId = mangaCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} products.", products.Count);
        }
    }
}
