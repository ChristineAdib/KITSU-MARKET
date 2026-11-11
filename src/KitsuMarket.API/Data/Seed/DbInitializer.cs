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
                    ImageUrl = "http://localhost:5232/uploads/luffy_gear5.jpg"
                },
                new()
                {
                    Name = "Apparel",
                    Slug = "apparel",
                    ImageUrl = "http://localhost:5232/uploads/akatsuki_haori.jpg"
                },
                new()
                {
                    Name = "Accessories",
                    Slug = "accessories",
                    ImageUrl = "http://localhost:5232/uploads/tanjiro_earrings.jpg"
                },
                new()
                {
                    Name = "Posters",
                    Slug = "posters",
                    ImageUrl = "http://localhost:5232/uploads/ghibli_spirited_away.jpg"
                },
                new()
                {
                    Name = "Manga",
                    Slug = "manga",
                    ImageUrl = "http://localhost:5232/uploads/chainsaw_man_box.jpg"
                },
                new()
                {
                    Name = "Plushies",
                    Slug = "plushies",
                    ImageUrl = "http://localhost:5232/uploads/pochita_plush.jpg"
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
            var plushiesCategory = await context.Categories.FirstAsync(c => c.Slug == "plushies");

            var products = new List<Product>
            {
                new()
                {
                    Name = "Monkey D. Luffy: Gear 5 Gigant Figuarts ZERO - One Piece",
                    Slug = "monkey-d-luffy-gear-5-gigant-figuarts-zero-one-piece",
                    Description = "Official Bandai Tamashii Nations Figuarts ZERO statue of Monkey D. Luffy achieving Gear 5 Gigant form in Wano Country. Features translucent lightning aura effects and dynamic comic-style sculpting.",
                    Price = 4200.00m,
                    StockQuantity = 15,
                    ImageUrl = "http://localhost:5232/uploads/luffy_gear5.jpg",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Gojo Satoru: Infinite Void S.H.Figuarts Figure - Jujutsu Kaisen",
                    Slug = "gojo-satoru-infinite-void-shfiguarts-figure-jujutsu-kaisen",
                    Description = "Highly articulated official S.H.Figuarts action figure of Gojo Satoru from Jujutsu Kaisen. Includes interchangeable unmasked head sculpt, blindfold accessory, and domain expansion hand parts.",
                    Price = 3450.00m,
                    StockQuantity = 18,
                    ImageUrl = "http://localhost:5232/uploads/gojo_satoru.jpg",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Tanjiro Kamado: Hinokami Kagura Dance Figuarts ZERO - Demon Slayer",
                    Slug = "tanjiro-kamado-hinokami-kagura-dance-figuarts-zero-demon-slayer",
                    Description = "Dynamic collector statue capturing Tanjiro executing the Hinokami Kagura Dance against Rui. Features vivid translucent flame dragon effect parts and sculpted checkerboard haori in motion.",
                    Price = 3850.00m,
                    StockQuantity = 12,
                    ImageUrl = "http://localhost:5232/uploads/tanjiro_hinokami.jpg",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Roronoa Zoro: Three-Sword Style Wano Country Figuarts ZERO - One Piece",
                    Slug = "roronoa-zoro-three-sword-style-wano-country-figuarts-zero-one-piece",
                    Description = "Authentic Bandai Figuarts ZERO collectible figure of Roronoa Zoro (Zoro-juro) wielding Shusui, Wado Ichimonji, and Sandai Kitetsu with dynamic wind slash sculpting.",
                    Price = 3600.00m,
                    StockQuantity = 14,
                    ImageUrl = "http://localhost:5232/uploads/zoro_wano.jpg",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Evangelion EVA Unit-01 Test Type Metal Build Figure",
                    Slug = "evangelion-eva-unit-01-test-type-metal-build-figure",
                    Description = "Premium die-cast Metal Build figure of EVA Unit-01 designed by Ikuto Yamashita. Features die-cast metal joints, progressive knife, pallet rifle, and display stand.",
                    Price = 5800.00m,
                    StockQuantity = 8,
                    ImageUrl = "http://localhost:5232/uploads/eva01_metalbuild.jpg",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Naruto Uzumaki: Rasengan Kizuna Relation Figuarts ZERO - Naruto Shippuden",
                    Slug = "naruto-uzumaki-rasengan-kizuna-relation-figuarts-zero-naruto-shippuden",
                    Description = "Dynamic Figuarts ZERO statue of Naruto Uzumaki launching a swirling Rasengan attack. Detailed chakra wind effect sculpting and Sage Mode scroll.",
                    Price = 3250.00m,
                    StockQuantity = 16,
                    ImageUrl = "http://localhost:5232/uploads/naruto_rasengan.jpg",
                    CategoryId = figuresCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Akatsuki Red Cloud Embroidered Streetwear Haori Kimono Cardigan",
                    Slug = "akatsuki-red-cloud-embroidered-streetwear-haori-kimono-cardigan",
                    Description = "Premium Japanese streetwear open-front kimono cardigan featuring embroidered Akatsuki red cloud iconography on heavyweight black cotton weave with relaxed unisex fit.",
                    Price = 1350.00m,
                    StockQuantity = 40,
                    ImageUrl = "http://localhost:5232/uploads/akatsuki_haori.jpg",
                    CategoryId = apparelCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Survey Corps Wings of Freedom Hooded Field Cloak - Attack on Titan",
                    Slug = "survey-corps-wings-of-freedom-hooded-field-cloak-attack-on-titan",
                    Description = "Heavy emerald-green wool blend scout regiment hooded cloak with silver button clasp and large embroidered Wings of Freedom back insignia.",
                    Price = 1100.00m,
                    StockQuantity = 45,
                    ImageUrl = "http://localhost:5232/uploads/survey_corps_cloak.jpg",
                    CategoryId = apparelCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Cyberpunk Edgerunners Style Heavy Streetwear Jacket",
                    Slug = "cyberpunk-edgerunners-style-heavy-streetwear-jacket",
                    Description = "Futuristic urban oversized tactical streetwear jacket featuring dual-layer weather-resistant fabric, utility cargo pockets, and reflective contrast detailing.",
                    Price = 1950.00m,
                    StockQuantity = 25,
                    ImageUrl = "http://localhost:5232/uploads/cyberpunk_jacket.jpg",
                    CategoryId = apparelCategory.Id,
                    IsActive = true,
                    IsFeatured = false,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Tanjiro Kamado Traditional Hanafuda Sterling Silver Earrings",
                    Slug = "tanjiro-kamado-traditional-hanafuda-sterling-silver-earrings",
                    Description = "Detailed replica of the sun-rising Hanafuda earrings inherited from Yoriichi Tsugikuni. Made from 925 sterling silver hooks with polished lightweight acrylic enamel drops.",
                    Price = 580.00m,
                    StockQuantity = 60,
                    ImageUrl = "http://localhost:5232/uploads/tanjiro_earrings.jpg",
                    CategoryId = accessoriesCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Death Note Deluxe Prop Journal with Rules & Feather Quill Pen",
                    Slug = "death-note-deluxe-prop-journal-with-rules-feather-quill-pen",
                    Description = "Screen-accurate replica of the Death Note notebook featuring embossed faux-leather cover, printed bilingual usage rules, lined parchment pages, and black feather quill ballpoint pen.",
                    Price = 690.00m,
                    StockQuantity = 50,
                    ImageUrl = "http://localhost:5232/uploads/death_note_book.jpg",
                    CategoryId = accessoriesCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Pochita 1:1 Scale Huggable Lifesize Plush - Chainsaw Man",
                    Slug = "pochita-1-1-scale-huggable-lifesize-plush-chainsaw-man",
                    Description = "Official Good Smile 1:1 scale lifesize huggable plush toy of Pochita, the Chainsaw Devil. Features ultra-soft orange velboa fabric, fabric chainsaw blade, and tail pull cord.",
                    Price = 1150.00m,
                    StockQuantity = 35,
                    ImageUrl = "http://localhost:5232/uploads/pochita_plush.jpg",
                    CategoryId = plushiesCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Anya Forger's Chimera Lion Familiar Plush Toy - Spy x Family",
                    Slug = "anya-forgers-chimera-lion-familiar-plush-toy-spy-x-family",
                    Description = "Anya's secret agent familiar Chimera plushie featuring multi-colored felt lion mane, soft pastel green fairy wings, and embroidered smiling face.",
                    Price = 890.00m,
                    StockQuantity = 40,
                    ImageUrl = "http://localhost:5232/uploads/anya_chimera.jpg",
                    CategoryId = plushiesCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Berserk Deluxe Edition Volume 1 (Leatherbound Hardcover)",
                    Slug = "berserk-deluxe-edition-volume-1-leatherbound-hardcover",
                    Description = "Dark Horse oversized 7x10 inch deluxe faux-leather hardcover collecting volumes 1-3 of Kentaro Miura's dark fantasy masterpiece with blood-red foil lettering and satin bookmark ribbon.",
                    Price = 1850.00m,
                    StockQuantity = 25,
                    ImageUrl = "http://localhost:5232/uploads/berserk_deluxe.png",
                    CategoryId = mangaCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Chainsaw Man Complete Part 1 Manga Box Set (Vols. 1-11)",
                    Slug = "chainsaw-man-complete-part-1-manga-box-set-vols-1-11",
                    Description = "VIZ Media official complete box set collecting all eleven volumes of the Public Safety Arc by Tatsuki Fujimoto. Includes collector box case and exclusive double-sided art poster.",
                    Price = 2450.00m,
                    StockQuantity = 20,
                    ImageUrl = "http://localhost:5232/uploads/chainsaw_man_box.jpg",
                    CategoryId = mangaCategory.Id,
                    IsActive = true,
                    IsFeatured = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Spirited Away: Yubaba's Bathhouse Sunset Archival Art Print (A2)",
                    Slug = "spirited-away-yubabas-bathhouse-sunset-archival-art-print-a2",
                    Description = "Museum-grade heavy matte archival print featuring the magical multi-tiered hot spring bathhouse from Studio Ghibli's Spirited Away during golden hour twilight.",
                    Price = 480.00m,
                    StockQuantity = 55,
                    ImageUrl = "http://localhost:5232/uploads/ghibli_spirited_away.jpg",
                    CategoryId = postersCategory.Id,
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
