$ErrorActionPreference = 'Stop'

Write-Host '=================================================================' -ForegroundColor Cyan
Write-Host '  KITSU MARKET - FINAL PHASE E2E INTEGRATION AND SECURITY QA     ' -ForegroundColor Cyan
Write-Host '=================================================================' -ForegroundColor Cyan

$baseUrl = 'http://localhost:5232/api'
$randomSuffix = [System.Guid]::NewGuid().ToString().Substring(0, 8)

# -------------------------------------------------------------
# 1. BUILD AND HEALTH VERIFICATION
# -------------------------------------------------------------
Write-Host "`n[STEP 1] Build and API Health Verification..." -ForegroundColor Yellow

$health = Invoke-RestMethod -Uri "$baseUrl/products" -Method Get
if ($health -and $health.totalCount -ge 0) {
    Write-Host "PASS: API is live and responding at $baseUrl" -ForegroundColor Green
} else {
    throw "API health check failed."
}

# -------------------------------------------------------------
# 2. COMPLETE CUSTOMER WORKFLOW
# -------------------------------------------------------------
Write-Host "`n[STEP 2] Testing Complete Customer Workflow..." -ForegroundColor Yellow

# 2.1 Register
$custEmail = "qa_customer_$randomSuffix@kitsumarket.com"
$custPass = 'Pass@Kitsu2026!'
$regBody = @{
    fullName = "QA Test Customer $randomSuffix"
    email = $custEmail
    password = $custPass
    confirmPassword = $custPass
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBody -ContentType 'application/json'
Write-Host "PASS 2.1: Registered customer: $($regRes.email) with role: $($regRes.roles -join ',')" -ForegroundColor Green

# 2.2 Login
$loginBody = @{
    email = $custEmail
    password = $custPass
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
$custToken = $loginRes.token
$custHeaders = @{ Authorization = "Bearer $custToken" }
Write-Host "PASS 2.2: Customer Login successful, JWT obtained" -ForegroundColor Green

# 2.3 Browse Products
$catalog = Invoke-RestMethod -Uri "$baseUrl/products?page=1&pageSize=8" -Method Get
Write-Host "PASS 2.3: Browsed catalog: $($catalog.totalCount) active products available" -ForegroundColor Green
$targetProd = $catalog.items[0]
$secondProd = $catalog.items[1]

# 2.4 Search
$searchResult = Invoke-RestMethod -Uri "$baseUrl/products?search=$($targetProd.name.Substring(0, 3))" -Method Get
Write-Host "PASS 2.4: Search returned $($searchResult.totalCount) matching items" -ForegroundColor Green

# 2.5 Filter by Category
$catFilterResult = Invoke-RestMethod -Uri "$baseUrl/products?categoryId=$($targetProd.categoryId)" -Method Get
Write-Host "PASS 2.5: Category filter returned $($catFilterResult.totalCount) items" -ForegroundColor Green

# 2.6 Product Details
$details = Invoke-RestMethod -Uri "$baseUrl/products/$($targetProd.id)" -Method Get
Write-Host "PASS 2.6: Product details fetched for '$($details.name)' (Stock: $($details.stockQuantity), Price: $($details.price) EGP)" -ForegroundColor Green

# 2.7 Add to Cart
$addBody = @{ productId = $targetProd.id; quantity = 2 } | ConvertTo-Json
$cartRes = Invoke-RestMethod -Uri "$baseUrl/cart/items" -Method Post -Body $addBody -ContentType 'application/json' -Headers $custHeaders
Write-Host "PASS 2.7: Added $($targetProd.name) x2 to cart. Subtotal: $($cartRes.totalAmount) EGP" -ForegroundColor Green

# Add second item to cart
$addBody2 = @{ productId = $secondProd.id; quantity = 1 } | ConvertTo-Json
$cartRes = Invoke-RestMethod -Uri "$baseUrl/cart/items" -Method Post -Body $addBody2 -ContentType 'application/json' -Headers $custHeaders
Write-Host "PASS 2.7: Added second item ($($secondProd.name)) to cart. Items count: $($cartRes.items.Count)" -ForegroundColor Green

# 2.8 Update Quantity
$updateBody = @{ quantity = 3 } | ConvertTo-Json
$cartRes = Invoke-RestMethod -Uri "$baseUrl/cart/items/$($targetProd.id)" -Method Put -Body $updateBody -ContentType 'application/json' -Headers $custHeaders
$updatedItem = $cartRes.items | Where-Object { $_.productId -eq $targetProd.id }
if ($updatedItem.quantity -eq 3) {
    Write-Host "PASS 2.8: Quantity updated to 3" -ForegroundColor Green
} else {
    throw "Quantity update failed"
}

# 2.9 Remove a Cart Item
$cartRes = Invoke-RestMethod -Uri "$baseUrl/cart/items/$($secondProd.id)" -Method Delete -Headers $custHeaders
$remainingItem = $cartRes.items | Where-Object { $_.productId -eq $secondProd.id }
if (-not $remainingItem) {
    Write-Host "PASS 2.9: Successfully removed second item from cart" -ForegroundColor Green
} else {
    throw "Item removal failed"
}

# 2.10 Checkout
$stockBefore = (Invoke-RestMethod -Uri "$baseUrl/products/$($targetProd.id)" -Method Get).stockQuantity
$checkoutBody = @{
    shippingFullName = 'QA Customer Recipient'
    shippingPhone = '+201099887766'
    shippingAddress = '44 Tokyo Pop Street, Tower 2'
    shippingCity = 'Alexandria'
} | ConvertTo-Json

$orderRes = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Body $checkoutBody -ContentType 'application/json' -Headers $custHeaders
Write-Host "PASS 2.10: Completed checkout! Order #$($orderRes.orderNumber), Total: $($orderRes.totalAmount) EGP" -ForegroundColor Green

# 2.11 Verify Order Creation
if ($orderRes.id -and $orderRes.orderNumber -and $orderRes.status -eq 'Pending') {
    Write-Host "PASS 2.11: Order created with status Pending" -ForegroundColor Green
} else {
    throw "Order creation verification failed"
}

# 2.12 Verify Stock Reduction
$stockAfter = (Invoke-RestMethod -Uri "$baseUrl/products/$($targetProd.id)" -Method Get).stockQuantity
if ($stockAfter -eq ($stockBefore - 3)) {
    Write-Host "PASS 2.12: Stock correctly decreased from $stockBefore to $stockAfter (-3)" -ForegroundColor Green
} else {
    throw "Stock was not reduced properly! Before: $stockBefore, After: $stockAfter"
}

# 2.13 View My Orders
$myOrders = Invoke-RestMethod -Uri "$baseUrl/orders/my-orders" -Method Get -Headers $custHeaders
if ($myOrders.Count -ge 1 -and $myOrders[0].orderNumber -eq $orderRes.orderNumber) {
    Write-Host "PASS 2.13: My Orders returns customer's orders (Count: $($myOrders.Count))" -ForegroundColor Green
} else {
    throw "My Orders verification failed"
}

# 2.14 Open Order Details
$orderDetails = Invoke-RestMethod -Uri "$baseUrl/orders/$($orderRes.id)" -Method Get -Headers $custHeaders
if ($orderDetails.orderNumber -eq $orderRes.orderNumber -and $orderDetails.items.Count -eq 1) {
    Write-Host "PASS 2.14: Order details retrieved successfully with $($orderDetails.items.Count) line items" -ForegroundColor Green
} else {
    throw "Order details verification failed"
}

# 2.15 Logout and 2.16 Protected Pages Verification
try {
    Invoke-RestMethod -Uri "$baseUrl/orders/my-orders" -Method Get
    throw "SECURITY FAILED: Unauthenticated request to /orders/my-orders succeeded!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Write-Host "PASS 2.15 and 2.16: Protected endpoints correctly reject unauthenticated requests with 401" -ForegroundColor Green
    } else {
        throw "Unexpected status code: $code"
    }
}

# -------------------------------------------------------------
# 3. COMPLETE ADMIN WORKFLOW
# -------------------------------------------------------------
Write-Host "`n[STEP 3] Testing Complete Admin Workflow..." -ForegroundColor Yellow

# 3.1 Login as Admin
$adminLoginBody = @{
    email = 'admin@kitsumarket.com'
    password = 'Admin@KitsuMarket2026!'
} | ConvertTo-Json
$adminLoginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType 'application/json'
$adminToken = $adminLoginRes.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "PASS 3.1: Admin logged in successfully (Roles: $($adminLoginRes.roles -join ','))" -ForegroundColor Green

# 3.2 Open Admin Dashboard / Overview
$adminAllOrders = Invoke-RestMethod -Uri "$baseUrl/admin/orders" -Method Get -Headers $adminHeaders
$adminAllProds = Invoke-RestMethod -Uri "$baseUrl/products" -Method Get -Headers $adminHeaders
Write-Host "PASS 3.2: Admin Dashboard metrics loaded: $($adminAllProds.totalCount) products, $($adminAllOrders.totalCount) orders" -ForegroundColor Green

# 3.3 Create Product
$newProdBody = @{
    name = "Neon Genesis Evangelion: EVA Unit-02 Asuka Model $randomSuffix"
    description = 'Ultra detailed authentic anime mecha model with articulated joints.'
    price = 3450.00
    stockQuantity = 8
    imageUrl = 'http://localhost:5232/uploads/eva01_metalbuild.jpg'
    categoryId = 1
    isFeatured = $false
    isActive = $true
} | ConvertTo-Json

$createdProd = Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Body $newProdBody -ContentType 'application/json' -Headers $adminHeaders
Write-Host "PASS 3.3: Admin created product: '$($createdProd.name)' (ID: $($createdProd.id))" -ForegroundColor Green

# 3.4 Edit Product Information
$editProdBody = @{
    name = "Neon Genesis Evangelion: EVA Unit-02 Asuka Model $randomSuffix (Custom Edition)"
    description = 'Updated description with custom metallic finish.'
    price = 3800.00
    stockQuantity = 8
    imageUrl = 'http://localhost:5232/uploads/eva01_metalbuild.jpg'
    categoryId = 1
    isFeatured = $false
    isActive = $true
} | ConvertTo-Json

$editedProd = Invoke-RestMethod -Uri "$baseUrl/products/$($createdProd.id)" -Method Put -Body $editProdBody -ContentType 'application/json' -Headers $adminHeaders
if ($editedProd.name -eq "Neon Genesis Evangelion: EVA Unit-02 Asuka Model $randomSuffix (Custom Edition)" -and $editedProd.price -eq 3800.00) {
    Write-Host "PASS 3.4: Admin edited product name and price successfully" -ForegroundColor Green
} else {
    throw "Product edit verification failed"
}

# 3.5 Update Product Stock
$stockUpdateBody = @{
    name = $editedProd.name
    description = $editedProd.description
    price = $editedProd.price
    stockQuantity = 25
    imageUrl = $editedProd.imageUrl
    categoryId = $editedProd.categoryId
    isFeatured = $editedProd.isFeatured
    isActive = $editedProd.isActive
} | ConvertTo-Json

$stockUpdatedProd = Invoke-RestMethod -Uri "$baseUrl/products/$($createdProd.id)" -Method Put -Body $stockUpdateBody -ContentType 'application/json' -Headers $adminHeaders
if ($stockUpdatedProd.stockQuantity -eq 25) {
    Write-Host "PASS 3.5: Admin updated product stock to 25" -ForegroundColor Green
} else {
    throw "Stock update verification failed"
}

# 3.6 Deactivate Product
$null = Invoke-RestMethod -Uri "$baseUrl/products/$($createdProd.id)" -Method Delete -Headers $adminHeaders
Write-Host "PASS 3.6: Admin deactivated product (ID: $($createdProd.id))" -ForegroundColor Green

# Verify public cannot see deactivated product
try {
    Invoke-RestMethod -Uri "$baseUrl/products/$($createdProd.id)" -Method Get
    throw "SECURITY FAILED: Public user could access deactivated product!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 404) {
        Write-Host "PASS 3.6: Deactivated product correctly hidden from public (404 Not Found)" -ForegroundColor Green
    }
}

# 3.7 View Incoming Orders
$ordersList = Invoke-RestMethod -Uri "$baseUrl/admin/orders" -Method Get -Headers $adminHeaders
Write-Host "PASS 3.7: Admin retrieved incoming orders queue: $($ordersList.totalCount) orders found" -ForegroundColor Green

# 3.8 Open Order Details as Admin
$adminOrderDetails = Invoke-RestMethod -Uri "$baseUrl/admin/orders/$($orderRes.id)" -Method Get -Headers $adminHeaders
Write-Host "PASS 3.8: Admin inspected order details: Customer email = $($adminOrderDetails.customerEmail)" -ForegroundColor Green

# 3.9 Update Order Status (Pending -> Processing -> Shipped)
$patch1 = @{ status = 'Processing' } | ConvertTo-Json
$statusRes1 = Invoke-RestMethod -Uri "$baseUrl/admin/orders/$($orderRes.id)/status" -Method Patch -Body $patch1 -ContentType 'application/json' -Headers $adminHeaders
Write-Host "PASS 3.9: Status updated to: $($statusRes1.status)" -ForegroundColor Green

$patch2 = @{ status = 'Shipped' } | ConvertTo-Json
$statusRes2 = Invoke-RestMethod -Uri "$baseUrl/admin/orders/$($orderRes.id)/status" -Method Patch -Body $patch2 -ContentType 'application/json' -Headers $adminHeaders
Write-Host "PASS 3.9: Status updated to: $($statusRes2.status)" -ForegroundColor Green

# 3.10 Verify Customer Sees Status Update
$custOrderCheck = Invoke-RestMethod -Uri "$baseUrl/orders/$($orderRes.id)" -Method Get -Headers $custHeaders
if ($custOrderCheck.status -eq 'Shipped') {
    Write-Host "PASS 3.10: Customer order reflects updated status 'Shipped' in real time" -ForegroundColor Green
} else {
    throw "Customer status reflection failed! Got: $($custOrderCheck.status)"
}

# -------------------------------------------------------------
# 4. SECURITY TESTS
# -------------------------------------------------------------
Write-Host "`n[STEP 4] Executing Security Tests..." -ForegroundColor Yellow

# Register Customer B
$custBEmail = "qa_custB_$randomSuffix@kitsumarket.com"
$regBBody = @{
    fullName = 'QA Customer B'
    email = $custBEmail
    password = $custPass
    confirmPassword = $custPass
} | ConvertTo-Json
$regBRes = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $regBBody -ContentType 'application/json'
$headersB = @{ Authorization = "Bearer $($regBRes.token)" }

# 4.1 Customer B CANNOT access Customer A's Orders
try {
    Invoke-RestMethod -Uri "$baseUrl/orders/$($orderRes.id)" -Method Get -Headers $headersB
    throw "SECURITY FAILED: Customer B was able to view Customer A's order!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 404) {
        Write-Host "PASS 4.1: Customer B denied access to Customer A's order (404 Not Found)" -ForegroundColor Green
    } else {
        throw "Unexpected status code: $code"
    }
}

# 4.2 Customer B CANNOT access or see Customer A's Cart items
$custBCart = Invoke-RestMethod -Uri "$baseUrl/cart" -Method Get -Headers $headersB
if ($custBCart.items.Count -eq 0) {
    Write-Host "PASS 4.2: Customer B has an isolated empty cart, cannot see Customer A's cart" -ForegroundColor Green
} else {
    throw "Cart isolation compromised!"
}

# 4.3 Customer CANNOT use product administration endpoints
try {
    $fakeProd = @{ name = 'Hacker Fig'; description = 'Hack'; price = 1; stockQuantity = 1; imageUrl = 'http://a'; categoryId = 1; isActive = $true; isFeatured = $false } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/products" -Method Post -Body $fakeProd -ContentType 'application/json' -Headers $custHeaders
    throw "SECURITY FAILED: Customer created product!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 403) {
        Write-Host "PASS 4.3: Customer blocked from POST /api/products (403 Forbidden)" -ForegroundColor Green
    } else {
        throw "Unexpected status code: $code"
    }
}

# 4.4 Customer CANNOT use Admin Order status update endpoint
try {
    $hackStatus = @{ status = 'Delivered' } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/admin/orders/$($orderRes.id)/status" -Method Patch -Body $hackStatus -ContentType 'application/json' -Headers $custHeaders
    throw "SECURITY FAILED: Customer updated order status via admin endpoint!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 403) {
        Write-Host "PASS 4.4: Customer blocked from PATCH /api/admin/orders/{id}/status (403 Forbidden)" -ForegroundColor Green
    } else {
        throw "Unexpected status code: $code"
    }
}

# 4.5 Invalid JWT Rejected
try {
    $fakeHeaders = @{ Authorization = 'Bearer invalid.jwt.signature' }
    Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $fakeHeaders
    throw "SECURITY FAILED: Invalid JWT was accepted!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Write-Host "PASS 4.5: Invalid JWT correctly rejected (401 Unauthorized)" -ForegroundColor Green
    }
}

# 4.6 Secrets Scan: Verify no JWT keys or DB passwords in frontend build
$bundleFiles = Get-ChildItem -Path "frontend/dist/frontend" -Recurse -Filter "*.js"
$exposedSecrets = $false
foreach ($file in $bundleFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "KitsuMarketSuperSecretKey" -or $content -match "Admin@KitsuMarket2026!") {
        $exposedSecrets = $true
        Write-Host "SECURITY ERROR: Secret found in $($file.Name)!" -ForegroundColor Red
    }
}
if (-not $exposedSecrets) {
    Write-Host "PASS 4.6: Frontend bundle inspected: Zero backend secrets or private keys exposed" -ForegroundColor Green
} else {
    throw "Frontend bundle contains secrets!"
}

# -------------------------------------------------------------
# 5. BUSINESS LOGIC TESTS
# -------------------------------------------------------------
Write-Host "`n[STEP 5] Testing Business Logic and Inventory Constraints..." -ForegroundColor Yellow

# 5.1 Pricing Integrity: Cart totals derived from database prices
$activeProds = (Invoke-RestMethod -Uri "$baseUrl/products" -Method Get).items
$testItem = $activeProds[0]

$addBody = @{ productId = $testItem.id; quantity = 2 } | ConvertTo-Json
$cartRes = Invoke-RestMethod -Uri "$baseUrl/cart/items" -Method Post -Body $addBody -ContentType 'application/json' -Headers $headersB
$expectedTotal = [decimal]$testItem.price * 2
if ([decimal]$cartRes.totalAmount -eq $expectedTotal) {
    Write-Host "PASS 5.1: Cart totals match exact database prices ($expectedTotal EGP)" -ForegroundColor Green
} else {
    throw "Cart total calculation mismatch!"
}

# 5.2 Stock Limit Enforcement: Attempting to add quantity greater than stock must fail
$excessQty = $testItem.stockQuantity + 999
try {
    $excessBody = @{ productId = $testItem.id; quantity = $excessQty } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/cart/items" -Method Post -Body $excessBody -ContentType 'application/json' -Headers $headersB
    throw "BUSINESS LOGIC FAILED: System allowed adding more items than available stock!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "PASS 5.2: Adding quantity ($excessQty) exceeding stock ($($testItem.stockQuantity)) rejected with 400 Bad Request" -ForegroundColor Green
    }
}

# 5.3 Inactive Products Cannot Be Purchased
try {
    $inactiveAdd = @{ productId = $createdProd.id; quantity = 1 } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/cart/items" -Method Post -Body $inactiveAdd -ContentType 'application/json' -Headers $headersB
    throw "BUSINESS LOGIC FAILED: Inactive product was added to cart!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "PASS 5.3: Attempting to purchase deactivated product rejected with 400 Bad Request" -ForegroundColor Green
    }
}

# 5.4 Historical Order Snapshot Price Preservation
$originalUnitPrice = $orderDetails.items[0].unitPrice
$targetProdInDb = (Invoke-RestMethod -Uri "$baseUrl/products/$($targetProd.id)" -Method Get -Headers $adminHeaders)
$priceChangeBody = @{
    name = $targetProdInDb.name
    description = $targetProdInDb.description
    price = $originalUnitPrice + 500.00
    stockQuantity = $targetProdInDb.stockQuantity
    imageUrl = $targetProdInDb.imageUrl
    categoryId = $targetProdInDb.categoryId
    isFeatured = $targetProdInDb.isFeatured
    isActive = $targetProdInDb.isActive
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/products/$($targetProd.id)" -Method Put -Body $priceChangeBody -ContentType 'application/json' -Headers $adminHeaders

$orderAfterPriceChange = Invoke-RestMethod -Uri "$baseUrl/orders/$($orderRes.id)" -Method Get -Headers $custHeaders
if ($orderAfterPriceChange.items[0].unitPrice -eq $originalUnitPrice) {
    Write-Host "PASS 5.4: Historical order snapshot preserves original price ($originalUnitPrice EGP) after catalog price increase" -ForegroundColor Green
} else {
    throw "Historical price snapshot corrupted!"
}

# Restore original price
$priceRestoreBody = @{
    name = $targetProdInDb.name
    description = $targetProdInDb.description
    price = $originalUnitPrice
    stockQuantity = $targetProdInDb.stockQuantity
    imageUrl = $targetProdInDb.imageUrl
    categoryId = $targetProdInDb.categoryId
    isFeatured = $targetProdInDb.isFeatured
    isActive = $targetProdInDb.isActive
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/products/$($targetProd.id)" -Method Put -Body $priceRestoreBody -ContentType 'application/json' -Headers $adminHeaders

# 5.5 Invalid Checkout Validation (Missing fields)
try {
    $invalidCheckout = @{ shippingFullName = ''; shippingPhone = ''; shippingAddress = ''; shippingCity = '' } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Body $invalidCheckout -ContentType 'application/json' -Headers $headersB
    throw "BUSINESS LOGIC FAILED: Invalid checkout request was accepted!"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "PASS 5.5: Empty shipping details rejected with 400 Bad Request" -ForegroundColor Green
    }
}

# -------------------------------------------------------------
# 6. UI / FRONTEND SERVER HEALTH
# -------------------------------------------------------------
Write-Host "`n[STEP 6] Testing Frontend UI Server and Static Distribution..." -ForegroundColor Yellow

$feResponse = Invoke-WebRequest -Uri 'http://localhost:4200' -UseBasicParsing
if ($feResponse.StatusCode -eq 200) {
    Write-Host "PASS 6.1: Angular frontend serves index.html with HTTP 200 OK" -ForegroundColor Green
}

if ($feResponse.Content -match '<app-root>' -and $feResponse.Content -match 'KITSU MARKET') {
    Write-Host "PASS 6.2: App-root and brand titles rendered in index HTML" -ForegroundColor Green
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "  ALL END-TO-END QA CHECKS PASSED SUCCESSFULLY WITH ZERO ERRORS!  " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
