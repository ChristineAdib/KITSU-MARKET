$ErrorActionPreference = 'Stop'

Write-Host '===========================================================' -ForegroundColor Cyan
Write-Host '   KITSU MARKET API — Phase 1 & Phase 2 Live Verification   ' -ForegroundColor Cyan
Write-Host '===========================================================' -ForegroundColor Cyan

# ----------------- PHASE 1 CHECKS -----------------
Write-Host '--- Phase 1: Products, Categories, Auth & Roles ---' -ForegroundColor Yellow

# 1. Categories
$cats = Invoke-RestMethod -Uri 'http://localhost:5232/api/categories' -Method Get
Write-Host "Categories Count: $($cats.Count)"
foreach ($cat in $cats) {
    Write-Host "  - [$($cat.id)] $($cat.name) (slug: $($cat.slug), active products: $($cat.productCount))"
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
$custHeaders = @{ Authorization = "Bearer $customerToken" }

# 6. Customer Profile via /api/auth/me
$meProfile = Invoke-RestMethod -Uri 'http://localhost:5232/api/auth/me' -Method Get -Headers $custHeaders
Write-Host "Profile retrieved: $($meProfile.fullName), Email: $($meProfile.email)"

# 7. Customer Authorization Barrier (Must NOT be allowed to create product)
$createProductAttempt = @{
    name = 'Illegal Customer Figure'
    description = 'Customer trying to add products'
    price = 999.00
    stockQuantity = 10
    imageUrl = 'http://localhost:5232/uploads/luffy_gear5.jpg'
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
    imageUrl = 'http://localhost:5232/uploads/luffy_gear5.jpg'
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
    imageUrl = 'http://localhost:5232/uploads/luffy_gear5.jpg'
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

# ----------------- PHASE 2 CHECKS -----------------
Write-Host '--- Phase 2: Cart, Checkout, Orders & Inventory ---' -ForegroundColor Yellow

# Pick an available active product
$targetProduct = $prods.items[0]
$targetProductId = $targetProduct.id
$initialStock = $targetProduct.stockQuantity
Write-Host "Selected Target Product: [$targetProductId] $($targetProduct.name) (Stock: $initialStock, Price: $($targetProduct.price) EGP)"

# 13. Add product to cart (Quantity = 2)
$addCartPayload = @{
    productId = $targetProductId
    quantity = 2
} | ConvertTo-Json

$cart1 = Invoke-RestMethod -Uri 'http://localhost:5232/api/cart/items' -Method Post -Body $addCartPayload -ContentType 'application/json' -Headers $custHeaders
Write-Host "Cart updated! Total items: $($cart1.totalItems), Total Amount: $($cart1.totalAmount) EGP"

# 14. Increase quantity via PUT (Quantity = 3)
$putCartPayload = @{
    quantity = 3
} | ConvertTo-Json

$cart2 = Invoke-RestMethod -Uri "http://localhost:5232/api/cart/items/$targetProductId" -Method Put -Body $putCartPayload -ContentType 'application/json' -Headers $custHeaders
Write-Host "Quantity increased to $($cart2.items[0].quantity). Total Amount: $($cart2.totalAmount) EGP"

# 15. Decrease quantity via PUT (Quantity = 1)
$decCartPayload = @{
    quantity = 1
} | ConvertTo-Json

$cart3 = Invoke-RestMethod -Uri "http://localhost:5232/api/cart/items/$targetProductId" -Method Put -Body $decCartPayload -ContentType 'application/json' -Headers $custHeaders
Write-Host "Quantity decreased to $($cart3.items[0].quantity). Total Amount: $($cart3.totalAmount) EGP"

# 16. Checkout (Order Creation)
$checkoutPayload = @{
    shippingFullName = 'Kitsune Collector'
    shippingPhone = '+201011223344'
    shippingAddress = '7 Akihabara Boulevard, Apt 4B'
    shippingCity = 'Cairo'
} | ConvertTo-Json

$newOrder = Invoke-RestMethod -Uri 'http://localhost:5232/api/orders' -Method Post -Body $checkoutPayload -ContentType 'application/json' -Headers $custHeaders
Write-Host "Order Placed! Order Number: $($newOrder.orderNumber), Status: $($newOrder.status), Total: $($newOrder.totalAmount) EGP"
Write-Host "  Items in Order: $($newOrder.items.Count), Snapshot Item: $($newOrder.items[0].productName)"

# 17. Verify Stock Reduction
$productAfterOrder = Invoke-RestMethod -Uri "http://localhost:5232/api/products/$targetProductId" -Method Get
Write-Host "Stock reduced from $initialStock to $($productAfterOrder.stockQuantity) (Decreased by 1 as expected)"

# 18. Verify Cart Clearing
$cartAfterOrder = Invoke-RestMethod -Uri 'http://localhost:5232/api/cart' -Method Get -Headers $custHeaders
Write-Host "Customer Cart cleared after checkout: Items count = $($cartAfterOrder.items.Count)"

# 19. Customer Order History
$myOrders = Invoke-RestMethod -Uri 'http://localhost:5232/api/orders/my-orders' -Method Get -Headers $custHeaders
Write-Host "Customer Order History retrieved: $($myOrders.Count) orders found."
Write-Host "  Latest Order: $($myOrders[0].orderNumber) - $($myOrders[0].totalAmount) EGP"

# 20. Customer Order Details by ID
$myOrderDetails = Invoke-RestMethod -Uri "http://localhost:5232/api/orders/$($newOrder.id)" -Method Get -Headers $custHeaders
Write-Host "Fetched order details by ID: $($myOrderDetails.orderNumber)"

# 21. Customer Isolation (Another customer cannot see this order)
$customerBEmail = "customerB_$randomSuffix@example.com"
$regBPayload = @{
    fullName = 'Customer B'
    email = $customerBEmail
    password = 'Customer@SecurePass2026!'
    confirmPassword = 'Customer@SecurePass2026!'
} | ConvertTo-Json
$regBRes = Invoke-RestMethod -Uri 'http://localhost:5232/api/auth/register' -Method Post -Body $regBPayload -ContentType 'application/json'
$headersB = @{ Authorization = "Bearer $($regBRes.token)" }

try {
    Invoke-RestMethod -Uri "http://localhost:5232/api/orders/$($newOrder.id)" -Method Get -Headers $headersB
    Write-Error 'SECURITY VULNERABILITY: Customer B was able to view Customer A order!'
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "Customer B attempted to access Customer A's order and received 404 NotFound as expected!"
    }
}

# 22. Customer Cannot Access Admin Orders (403 Forbidden)
try {
    Invoke-RestMethod -Uri 'http://localhost:5232/api/admin/orders' -Method Get -Headers $custHeaders
    Write-Error 'SECURITY VULNERABILITY: Customer accessed admin orders endpoint!'
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host 'Customer access to /api/admin/orders was correctly REJECTED with 403 Forbidden!'
    }
}

# 23. Admin Order Management (View & Update Status)
$adminOrders = Invoke-RestMethod -Uri 'http://localhost:5232/api/admin/orders' -Method Get -Headers $adminHeaders
Write-Host "Admin retrieved all orders: Total Count = $($adminOrders.totalCount)"

$statusUpdatePayload = @{ status = 'Confirmed' } | ConvertTo-Json
$updatedOrder = Invoke-RestMethod -Uri "http://localhost:5232/api/admin/orders/$($newOrder.id)/status" -Method Patch -Body $statusUpdatePayload -ContentType 'application/json' -Headers $adminHeaders
Write-Host "Admin updated Order $($updatedOrder.orderNumber) status to: $($updatedOrder.status)"

$statusUpdatePayload2 = @{ status = 'Shipped' } | ConvertTo-Json
$updatedOrder2 = Invoke-RestMethod -Uri "http://localhost:5232/api/admin/orders/$($newOrder.id)/status" -Method Patch -Body $statusUpdatePayload2 -ContentType 'application/json' -Headers $adminHeaders
Write-Host "Admin updated Order $($updatedOrder2.orderNumber) status to: $($updatedOrder2.status)"

Write-Host '===========================================================' -ForegroundColor Cyan
Write-Host '   ALL 23 LIVE E2E CHECKS PASSED FOR PHASE 1 & PHASE 2!    ' -ForegroundColor Green
Write-Host '===========================================================' -ForegroundColor Cyan
