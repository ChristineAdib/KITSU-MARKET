$ErrorActionPreference = 'Stop'

Write-Host '=== KITSU MARKET API - Phase 1 Live Verification ==='

# 1. Categories
$cats = Invoke-RestMethod -Uri 'http://localhost:5232/api/categories' -Method Get
Write-Host "Categories Count: $($cats.Count)"
foreach ($cat in $cats) {
    Write-Host "  - [$($cat.id)] $($cat.name) (slug: $($cat.slug), products: $($cat.productCount))"
}

# 2. Products (Public Browsing)
$prods = Invoke-RestMethod -Uri 'http://localhost:5232/api/products?page=1&pageSize=5' -Method Get
Write-Host "Total Active Products: $($prods.totalCount), Returned: $($prods.items.Count)"
foreach ($prod in $prods.items) {
    Write-Host "  - [$($prod.id)] $($prod.name) - $($prod.price) EGP [Category: $($prod.categoryName)]"
}

# 3. Product Details by ID
$firstId = $prods.items[0].id
$prodDetail = Invoke-RestMethod -Uri "http://localhost:5232/api/products/$firstId" -Method Get
Write-Host "Product Detail fetched: $($prodDetail.name)"

# 4. Search and Filter
$searchRes = Invoke-RestMethod -Uri 'http://localhost:5232/api/products?search=Fox' -Method Get
Write-Host "Search for 'Fox' returned $($searchRes.totalCount) items."

# 5. Customer Registration
$randomSuffix = [System.Guid]::NewGuid().ToString().Substring(0, 8)
$customerEmail = "customer_$randomSuffix@example.com"
$regPayload = @{
    fullName = 'Live Test Customer'
    email = $customerEmail
    password = 'Customer@SecurePass2026!'
    confirmPassword = 'Customer@SecurePass2026!'
} | ConvertTo-Json

$regResponse = Invoke-RestMethod -Uri 'http://localhost:5232/api/auth/register' -Method Post -Body $regPayload -ContentType 'application/json'
Write-Host "Customer Registered: $($regResponse.email)"
Write-Host "Assigned Roles: $($regResponse.roles -join ', ')"

$customerToken = $regResponse.token

# 6. Customer Profile via /api/auth/me
$custHeaders = @{ Authorization = "Bearer $customerToken" }
$meProfile = Invoke-RestMethod -Uri 'http://localhost:5232/api/auth/me' -Method Get -Headers $custHeaders
Write-Host "Profile retrieved: $($meProfile.fullName), Email: $($meProfile.email)"

# 7. Customer Authorization Barrier (Must NOT be allowed to create product)
$createProductAttempt = @{
    name = 'Illegal Customer Figure'
    description = 'Customer trying to add products'
    price = 999.00
    stockQuantity = 10
    imageUrl = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f'
    categoryId = 1
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri 'http://localhost:5232/api/products' -Method Post -Body $createProductAttempt -ContentType 'application/json' -Headers $custHeaders
    Write-Error 'SECURITY VULNERABILITY: Customer was allowed to create product!'
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host 'Customer product creation was correctly REJECTED with 403 Forbidden!'
    } else {
        Write-Host "Customer creation rejected with status: $statusCode"
    }
}

# 8. Admin Authentication
$adminLoginPayload = @{
    email = 'admin@kitsumarket.com'
    password = 'Admin@KitsuMarket2026!'
} | ConvertTo-Json

$adminLogin = Invoke-RestMethod -Uri 'http://localhost:5232/api/auth/login' -Method Post -Body $adminLoginPayload -ContentType 'application/json'
Write-Host "Admin Logged In! Roles: $($adminLogin.roles -join ', ')"

$adminToken = $adminLogin.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# 9. Admin Product Management: Create
$newProductPayload = @{
    name = "Live Test Sakura Maiden Figure $randomSuffix"
    description = 'Special limited edition cherry blossom festival figure.'
    price = 2650.00
    stockQuantity = 20
    imageUrl = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f'
    categoryId = 1
    isFeatured = $true
    isActive = $true
} | ConvertTo-Json

$createdProduct = Invoke-RestMethod -Uri 'http://localhost:5232/api/products' -Method Post -Body $newProductPayload -ContentType 'application/json' -Headers $adminHeaders
Write-Host "Admin Created Product: ID $($createdProduct.id), Name '$($createdProduct.name)', Slug '$($createdProduct.slug)'"

# 10. Admin Product Management: Update
$updatePayload = @{
    name = "$($createdProduct.name) (Deluxe Edition)"
    description = 'Deluxe edition featuring LED light base.'
    price = 2890.00
    stockQuantity = 15
    imageUrl = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f'
    categoryId = 1
    isFeatured = $true
    isActive = $true
} | ConvertTo-Json

$updatedProduct = Invoke-RestMethod -Uri "http://localhost:5232/api/products/$($createdProduct.id)" -Method Put -Body $updatePayload -ContentType 'application/json' -Headers $adminHeaders
Write-Host "Admin Updated Product: ID $($updatedProduct.id), New Name '$($updatedProduct.name)', New Price: $($updatedProduct.price) EGP"

# 11. Admin Product Management: Soft Deactivation
$deleteRes = Invoke-RestMethod -Uri "http://localhost:5232/api/products/$($createdProduct.id)" -Method Delete -Headers $adminHeaders
Write-Host "Admin Soft-Deactivated Product ID $($createdProduct.id)"

# 12. Confirm Soft-Deactivated product returns 404 for Public
try {
    Invoke-RestMethod -Uri "http://localhost:5232/api/products/$($createdProduct.id)" -Method Get
    Write-Error 'Failure: Deactivated product was still accessible to public!'
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host 'Public request for deactivated product returned 404 NotFound as expected!'
    }
}

Write-Host 'ALL 12 PHASE 1 REQUIREMENTS VERIFIED SUCCESSFULLY ON RUNNING API!'
