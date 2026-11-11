$ErrorActionPreference = 'Stop'

Write-Host "Connecting to KITSU MARKET API to seed authentic anime products..." -ForegroundColor Cyan

$baseUrl = 'http://localhost:5232/api'

# 1. Login as Admin
$adminLoginBody = @{
    email = 'admin@kitsumarket.com'
    password = 'Admin@KitsuMarket2026!'
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType 'application/json'
$adminToken = $loginRes.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "✔ Admin authenticated successfully." -ForegroundColor Green

# 2. Real Anime Products Payload
$products = @(
    @{
        name = "Monkey D. Luffy: Gear 5 Gigant Figuarts ZERO - One Piece"
        description = "Official Bandai Tamashii Nations Figuarts ZERO statue of Monkey D. Luffy achieving Gear 5 Gigant form in Wano Country. Features translucent lightning aura effects and dynamic comic-style sculpting."
        price = 4200.00
        stockQuantity = 15
        imageUrl = "http://localhost:5232/uploads/luffy_gear5.jpg"
        categoryId = 1
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Gojo Satoru: Infinite Void S.H.Figuarts Figure - Jujutsu Kaisen"
        description = "Highly articulated official S.H.Figuarts action figure of Gojo Satoru from Jujutsu Kaisen. Includes interchangeable unmasked head sculpt, blindfold accessory, and domain expansion hand parts."
        price = 3450.00
        stockQuantity = 18
        imageUrl = "http://localhost:5232/uploads/gojo_satoru.jpg"
        categoryId = 1
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Tanjiro Kamado: Hinokami Kagura Dance Figuarts ZERO - Demon Slayer"
        description = "Dynamic collector statue capturing Tanjiro executing the Hinokami Kagura Dance against Rui. Features vivid translucent flame dragon effect parts and sculpted checkerboard haori in motion."
        price = 3850.00
        stockQuantity = 12
        imageUrl = "http://localhost:5232/uploads/tanjiro_hinokami.jpg"
        categoryId = 1
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Roronoa Zoro: Three-Sword Style Wano Country Figuarts ZERO - One Piece"
        description = "Authentic Bandai Figuarts ZERO collectible figure of Roronoa Zoro (Zoro-juro) wielding Shusui, Wado Ichimonji, and Sandai Kitetsu with dynamic wind slash sculpting."
        price = 3600.00
        stockQuantity = 14
        imageUrl = "http://localhost:5232/uploads/zoro_wano.jpg"
        categoryId = 1
        isFeatured = $false
        isActive = $true
    },
    @{
        name = "Evangelion EVA Unit-01 Test Type Metal Build Figure"
        description = "Premium die-cast Metal Build figure of EVA Unit-01 designed by Ikuto Yamashita. Features die-cast metal joints, progressive knife, pallet rifle, and display stand."
        price = 5800.00
        stockQuantity = 8
        imageUrl = "http://localhost:5232/uploads/eva01_metalbuild.jpg"
        categoryId = 1
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Naruto Uzumaki: Rasengan Kizuna Relation Figuarts ZERO - Naruto Shippuden"
        description = "Dynamic Figuarts ZERO statue of Naruto Uzumaki launching a swirling Rasengan attack. Detailed chakra wind effect sculpting and Sage Mode scroll."
        price = 3250.00
        stockQuantity = 16
        imageUrl = "http://localhost:5232/uploads/naruto_rasengan.jpg"
        categoryId = 1
        isFeatured = $false
        isActive = $true
    },
    @{
        name = "Akatsuki Red Cloud Embroidered Streetwear Haori Kimono Cardigan"
        description = "Premium Japanese streetwear open-front kimono cardigan featuring embroidered Akatsuki red cloud iconography on heavyweight black cotton weave with relaxed unisex fit."
        price = 1350.00
        stockQuantity = 40
        imageUrl = "http://localhost:5232/uploads/akatsuki_haori.jpg"
        categoryId = 2
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Survey Corps Wings of Freedom Hooded Field Cloak - Attack on Titan"
        description = "Heavy emerald-green wool blend scout regiment hooded cloak with silver button clasp and large embroidered Wings of Freedom back insignia."
        price = 1100.00
        stockQuantity = 45
        imageUrl = "http://localhost:5232/uploads/survey_corps_cloak.jpg"
        categoryId = 2
        isFeatured = $false
        isActive = $true
    },
    @{
        name = "Cyberpunk Edgerunners Style Heavy Streetwear Jacket"
        description = "Futuristic urban oversized tactical streetwear jacket featuring dual-layer weather-resistant fabric, utility cargo pockets, and reflective contrast detailing."
        price = 1950.00
        stockQuantity = 25
        imageUrl = "http://localhost:5232/uploads/cyberpunk_jacket.jpg"
        categoryId = 2
        isFeatured = $false
        isActive = $true
    },
    @{
        name = "Tanjiro Kamado Traditional Hanafuda Sterling Silver Earrings"
        description = "Detailed replica of the sun-rising Hanafuda earrings inherited from Yoriichi Tsugikuni. Made from 925 sterling silver hooks with polished lightweight acrylic enamel drops."
        price = 580.00
        stockQuantity = 60
        imageUrl = "http://localhost:5232/uploads/tanjiro_earrings.jpg"
        categoryId = 3
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Death Note Deluxe Prop Journal with Rules & Feather Quill Pen"
        description = "Screen-accurate replica of the Death Note notebook featuring embossed faux-leather cover, printed bilingual usage rules, lined parchment pages, and black feather quill ballpoint pen."
        price = 690.00
        stockQuantity = 50
        imageUrl = "http://localhost:5232/uploads/death_note_book.jpg"
        categoryId = 3
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Pochita 1:1 Scale Huggable Lifesize Plush - Chainsaw Man"
        description = "Official Good Smile 1:1 scale lifesize huggable plush toy of Pochita, the Chainsaw Devil. Features ultra-soft orange velboa fabric, fabric chainsaw blade, and tail pull cord."
        price = 1150.00
        stockQuantity = 35
        imageUrl = "http://localhost:5232/uploads/pochita_plush.jpg"
        categoryId = 6
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Anya Forger's Chimera Lion Familiar Plush Toy - Spy x Family"
        description = "Anya's secret agent familiar Chimera plushie featuring multi-colored felt lion mane, soft pastel green fairy wings, and embroidered smiling face."
        price = 890.00
        stockQuantity = 40
        imageUrl = "http://localhost:5232/uploads/anya_chimera.jpg"
        categoryId = 6
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Berserk Deluxe Edition Volume 1 (Leatherbound Hardcover)"
        description = "Dark Horse oversized 7x10 inch deluxe faux-leather hardcover collecting volumes 1-3 of Kentaro Miura's dark fantasy masterpiece with blood-red foil lettering and satin bookmark ribbon."
        price = 1850.00
        stockQuantity = 25
        imageUrl = "http://localhost:5232/uploads/berserk_deluxe.png"
        categoryId = 5
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Chainsaw Man Complete Part 1 Manga Box Set (Vols. 1-11)"
        description = "VIZ Media official complete box set collecting all eleven volumes of the Public Safety Arc by Tatsuki Fujimoto. Includes collector box case and exclusive double-sided art poster."
        price = 2450.00
        stockQuantity = 20
        imageUrl = "http://localhost:5232/uploads/chainsaw_man_box.jpg"
        categoryId = 5
        isFeatured = $true
        isActive = $true
    },
    @{
        name = "Spirited Away: Yubaba's Bathhouse Sunset Archival Art Print (A2)"
        description = "Museum-grade heavy matte archival print featuring the magical multi-tiered hot spring bathhouse from Studio Ghibli's Spirited Away during golden hour twilight."
        price = 480.00
        stockQuantity = 55
        imageUrl = "http://localhost:5232/uploads/ghibli_spirited_away.jpg"
        categoryId = 4
        isFeatured = $false
        isActive = $true
    }
)

Write-Host "Creating $($products.Count) real anime products..." -ForegroundColor Yellow

$createdCount = 0
foreach ($prod in $products) {
    $payload = $prod | ConvertTo-Json
    try {
        $created = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Body $payload -ContentType 'application/json' -Headers $adminHeaders
        Write-Host "✔ Created: [$($created.id)] $($created.name) - $($created.price) EGP [Category: $($created.categoryName)]" -ForegroundColor Green
        $createdCount++
    } catch {
        Write-Host "✖ Error creating '$($prod.name)': $_" -ForegroundColor Red
    }
}

Write-Host "`nSuccessfully created $createdCount authentic anime products!" -ForegroundColor Cyan
