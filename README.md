# KITSU MARKET — Anime Merchandise E-Commerce Platform
## Phase 1 & Phase 2: Full Backend Architecture

### Overview
KITSU MARKET is an anime merchandise e-commerce platform backend built with **ASP.NET Core 8 Web API**, **Entity Framework Core 8**, **Microsoft SQL Server**, and **ASP.NET Core Identity** with **JWT Bearer Authentication** and **Role-Based Access Control (RBAC)**.

Phase 1 established the backend foundation, database schemas, authentication, roles, and product/category management.  
Phase 2 expanded the backend with the **Shopping Cart**, **Atomic Checkout**, **Order Management (Customer & Admin)**, and **Inventory Rules**.

---

### Technical Stack
- **Framework**: ASP.NET Core 8 Web API (`net8.0`)
- **Language**: C# 12
- **Database**: Microsoft SQL Server 2022
- **ORM**: Entity Framework Core 8.0 (Code-First with Migrations)
- **Identity & Security**: ASP.NET Core Identity & JWT Bearer Tokens (`System.IdentityModel.Tokens.Jwt`)
- **API Documentation**: Swagger / OpenAPI with Bearer Authorization (`Swashbuckle.AspNetCore`)
- **Testing**: xUnit, `Microsoft.AspNetCore.Mvc.Testing` (30 integration tests)

---

### Solution Architecture
```
InternTask4/
├── KitsuMarket.slnx
├── .gitignore
├── README.md
├── scripts/
│   └── verify_api.ps1               # Live automated 23-step verification script
├── src/
│   └── KitsuMarket.API/             # ASP.NET Core Web API Project
│       ├── Common/
│       │   └── SlugHelper.cs        # URL-friendly slug generation
│       ├── Controllers/
│       │   ├── AdminOrdersController.cs # Admin order management & status updates
│       │   ├── AuthController.cs        # Registration, login, profile
│       │   ├── CartController.cs        # Shopping cart CRUD
│       │   ├── CategoriesController.cs  # Public & Admin category operations
│       │   ├── OrdersController.cs      # Checkout & customer order history
│       │   └── ProductsController.cs    # Public catalog & Admin product management
│       ├── Data/
│       │   ├── ApplicationDbContext.cs
│       │   ├── Entities/
│       │   │   ├── ApplicationUser.cs
│       │   │   ├── Cart.cs
│       │   │   ├── CartItem.cs
│       │   │   ├── Category.cs
│       │   │   ├── Order.cs
│       │   │   ├── OrderItem.cs
│       │   │   ├── OrderStatus.cs
│       │   │   └── Product.cs
│       │   ├── EntityConfigurations/
│       │   │   ├── CartConfiguration.cs
│       │   │   ├── CartItemConfiguration.cs
│       │   │   ├── CategoryConfiguration.cs
│       │   │   ├── OrderConfiguration.cs
│       │   │   ├── OrderItemConfiguration.cs
│       │   │   └── ProductConfiguration.cs
│       │   ├── Migrations/
│       │   └── Seed/
│       │       └── DbInitializer.cs # Role, Admin, Category & Product seed
│       ├── DTOs/
│       │   ├── Auth/
│       │   ├── Cart/
│       │   ├── Categories/
│       │   ├── Common/
│       │   ├── Orders/
│       │   └── Products/
│       ├── Middleware/
│       │   └── ExceptionHandlingMiddleware.cs
│       ├── Services/
│       │   ├── ITokenService.cs
│       │   └── TokenService.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       └── Program.cs
└── tests/
    └── KitsuMarket.Tests/           # Automated Integration Test Suite (30 tests)
        ├── AuthTests.cs             # Identity, JWT, validation, roles (7 tests)
        ├── CartTests.cs             # Shopping cart operations & customer isolation (8 tests)
        ├── CategoryTests.cs         # Category browsing & Admin CRUD (3 tests)
        ├── OrderTests.cs            # Checkout, atomic stock deduction, orders (6 tests)
        ├── ProductTests.cs          # Public product search, filter, Admin CRUD (6 tests)
        └── TestWebApplicationFactory.cs
```

---

### Database Schema

#### 1. `AspNetUsers` (Extended via `ApplicationUser`)
- `Id` (nvarchar(450), PK)
- `FullName` (nvarchar(100), NOT NULL)
- `CreatedAtUtc` (datetime2, NOT NULL)
- `Email` (nvarchar(256), NOT NULL, Unique)
- `PasswordHash` (nvarchar(max))
- Standard ASP.NET Core Identity security columns

#### 2. `Categories`
- `Id` (int, IDENTITY PK)
- `Name` (nvarchar(100), NOT NULL)
- `Slug` (nvarchar(100), NOT NULL, UNIQUE Index)
- `ImageUrl` (nvarchar(500), NULL)

#### 3. `Products`
- `Id` (int, IDENTITY PK)
- `Name` (nvarchar(200), NOT NULL)
- `Slug` (nvarchar(200), NOT NULL, UNIQUE Index)
- `Description` (nvarchar(2000), NOT NULL)
- `Price` (decimal(18,2), NOT NULL)
- `StockQuantity` (int, NOT NULL)
- `ImageUrl` (nvarchar(500), NOT NULL)
- `CategoryId` (int, FK -> `Categories.Id`, OnDelete: Restrict)
- `IsActive` (bit, NOT NULL, DEFAULT 1)
- `IsFeatured` (bit, NOT NULL, DEFAULT 0)
- `CreatedAtUtc` (datetime2, NOT NULL)
- `UpdatedAtUtc` (datetime2, NULL)
- Composite Query Indexes: `(IsActive, CategoryId)`, `(IsActive, IsFeatured)`, `(IsActive, Price)`

#### 4. `Carts`
- `Id` (int, IDENTITY PK)
- `UserId` (nvarchar(450), NOT NULL, UNIQUE Index, FK -> `AspNetUsers.Id`, OnDelete: Cascade)
- `CreatedAtUtc` (datetime2, NOT NULL)
- `UpdatedAtUtc` (datetime2, NULL)

#### 5. `CartItems`
- `Id` (int, IDENTITY PK)
- `CartId` (int, NOT NULL, FK -> `Carts.Id`, OnDelete: Cascade)
- `ProductId` (int, NOT NULL, FK -> `Products.Id`, OnDelete: Restrict)
- `Quantity` (int, NOT NULL)
- Unique Index: `(CartId, ProductId)`

#### 6. `Orders`
- `Id` (int, IDENTITY PK)
- `OrderNumber` (nvarchar(50), NOT NULL, UNIQUE Index)
- `UserId` (nvarchar(450), NOT NULL, FK -> `AspNetUsers.Id`, OnDelete: Restrict, Index)
- `CreatedAtUtc` (datetime2, NOT NULL)
- `Status` (nvarchar(30), NOT NULL, Index) — Supported: `Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`
- `TotalAmount` (decimal(18,2), NOT NULL)
- `ShippingFullName` (nvarchar(100), NOT NULL)
- `ShippingPhone` (nvarchar(30), NOT NULL)
- `ShippingAddress` (nvarchar(250), NOT NULL)
- `ShippingCity` (nvarchar(100), NOT NULL)

#### 7. `OrderItems`
- `Id` (int, IDENTITY PK)
- `OrderId` (int, NOT NULL, FK -> `Orders.Id`, OnDelete: Cascade)
- `ProductId` (int, NULL, FK -> `Products.Id`, OnDelete: SetNull) — preserves historical orders even if products are deactivated or detached
- `ProductNameSnapshot` (nvarchar(200), NOT NULL)
- `ProductImageSnapshot` (nvarchar(500), NOT NULL)
- `UnitPrice` (decimal(18,2), NOT NULL)
- `Quantity` (int, NOT NULL)
- `LineTotal` (decimal(18,2), NOT NULL)

---

### Migration Commands

```bash
# Add new migration
dotnet ef migrations add <MigrationName> --project src/KitsuMarket.API/KitsuMarket.API.csproj --startup-project src/KitsuMarket.API/KitsuMarket.API.csproj

# Update database to latest migration
dotnet ef database update --project src/KitsuMarket.API/KitsuMarket.API.csproj --startup-project src/KitsuMarket.API/KitsuMarket.API.csproj
```

*(Migrations apply automatically on startup via `DbInitializer.SeedAsync()`)*

---

### Complete Endpoint Reference

#### Authentication (`/api/auth`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register customer (auto-assigns `Customer` role) |
| `POST` | `/api/auth/login` | Public | Authenticate user & return signed JWT with role claims |
| `GET` | `/api/auth/me` | Authenticated | Return authenticated profile & role claims |

#### Products (`/api/products`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | Paginated active products (search, category, price range, featured, sort) |
| `GET` | `/api/products/{id}` | Public | Get product details (returns 404 if deactivated) |
| `POST` | `/api/products` | Admin Only | Create product with auto-generated unique slug |
| `PUT` | `/api/products/{id}` | Admin Only | Update product details |
| `DELETE` | `/api/products/{id}` | Admin Only | Soft-deactivate product (`IsActive = false`) |

#### Categories (`/api/categories`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List categories with active product count |
| `GET` | `/api/categories/{id}` | Public | Get category details by ID |
| `POST` | `/api/categories` | Admin Only | Create new category |
| `PUT` | `/api/categories/{id}` | Admin Only | Update category name & image |
| `DELETE` | `/api/categories/{id}` | Admin Only | Delete empty category (blocks if products exist) |

#### Shopping Cart (`/api/cart`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/cart` | Authenticated | Retrieve customer's cart with live prices and line totals |
| `POST` | `/api/cart/items` | Authenticated | Add product or increment quantity (validates stock) |
| `PUT` | `/api/cart/items/{productId}` | Authenticated | Update exact quantity for product in cart |
| `DELETE` | `/api/cart/items/{productId}` | Authenticated | Remove specific product from cart |
| `DELETE` | `/api/cart` | Authenticated | Clear all items from customer's cart |

#### Customer Orders (`/api/orders`)
| Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Authenticated | Atomic checkout: validates stock, creates order & snapshots, decreases stock, clears cart |
| `GET` | `/api/orders/my-orders` | Authenticated | View authenticated customer's own order history |
| `GET` | `/api/orders/{id}` | Authenticated | View customer's order details (blocks other customers with 404) |

#### Admin Order Management (`/api/admin/orders`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/orders` | Admin Only | Paginated list of all customer orders (filter by status, search, sort) |
| `GET` | `/api/admin/orders/{id}` | Admin Only | Detailed view of any order with customer details and item snapshots |
| `PATCH` | `/api/admin/orders/{id}/status`| Admin Only | Update order status (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) |

---

### Example JSON Contracts for Angular Integration

#### 1. Register Customer
**`POST /api/auth/register`**
```json
// Request
{
  "fullName": "Sakura Kinomoto",
  "email": "sakura@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}

// Response (201 Created)
{
  "id": "e3a89047-975d-4f05-8774-72213e4b7b25",
  "fullName": "Sakura Kinomoto",
  "email": "sakura@example.com",
  "roles": ["Customer"],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAtUtc": "2026-11-11T02:40:00Z"
}
```

#### 2. Add to Cart
**`POST /api/cart/items`** (Header: `Authorization: Bearer <token>`)
```json
// Request
{
  "productId": 10,
  "quantity": 2
}

// Response (200 OK)
{
  "id": 1,
  "userId": "e3a89047-975d-4f05-8774-72213e4b7b25",
  "items": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Blade of Twilight: Omnibus Collection Vol. 1-3",
      "productSlug": "blade-of-twilight-omnibus-collection-vol-1-3",
      "productImageUrl": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
      "unitPrice": 590.00,
      "quantity": 2,
      "lineTotal": 1180.00,
      "stockQuantity": 35,
      "isAvailable": true
    }
  ],
  "totalItems": 2,
  "totalAmount": 1180.00,
  "createdAtUtc": "2026-11-11T00:30:00Z",
  "updatedAtUtc": "2026-11-11T00:31:00Z"
}
```

#### 3. Checkout (Create Order)
**`POST /api/orders`** (Header: `Authorization: Bearer <token>`)
```json
// Request
{
  "shippingFullName": "Sakura Kinomoto",
  "shippingPhone": "+201012345678",
  "shippingAddress": "42 Cherry Blossom Lane, District 5",
  "shippingCity": "Cairo"
}

// Response (201 Created)
{
  "id": 1,
  "orderNumber": "KM-20261111-754776",
  "userId": "e3a89047-975d-4f05-8774-72213e4b7b25",
  "createdAtUtc": "2026-11-11T00:35:00Z",
  "status": "Pending",
  "totalAmount": 1180.00,
  "totalItems": 2,
  "shippingFullName": "Sakura Kinomoto",
  "shippingPhone": "+201012345678",
  "shippingAddress": "42 Cherry Blossom Lane, District 5",
  "shippingCity": "Cairo",
  "items": [
    {
      "id": 1,
      "productId": 10,
      "productName": "Blade of Twilight: Omnibus Collection Vol. 1-3",
      "productImageUrl": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
      "unitPrice": 590.00,
      "quantity": 2,
      "lineTotal": 1180.00
    }
  ]
}
```

#### 4. Admin Update Order Status
**`PATCH /api/admin/orders/1/status`** (Header: `Authorization: Bearer <admin_token>`)
```json
// Request
{
  "status": "Confirmed"
}

// Response (200 OK)
{
  "id": 1,
  "orderNumber": "KM-20261111-754776",
  "userId": "e3a89047-975d-4f05-8774-72213e4b7b25",
  "customerEmail": "sakura@example.com",
  "customerFullName": "Sakura Kinomoto",
  "createdAtUtc": "2026-11-11T00:35:00Z",
  "status": "Confirmed",
  "totalAmount": 1180.00,
  "totalItems": 2,
  "shippingFullName": "Sakura Kinomoto",
  "shippingPhone": "+201012345678",
  "shippingAddress": "42 Cherry Blossom Lane, District 5",
  "shippingCity": "Cairo",
  "items": [ ... ]
}
```

---

### How to Run the Backend

1. **Start the API Server**:
   ```bash
   dotnet run --project src/KitsuMarket.API/KitsuMarket.API.csproj
   ```
2. **Access Swagger UI**:
   Navigate to: [http://localhost:5232/swagger](http://localhost:5232/swagger)
3. **Execute Live 23-Step End-to-End Test**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/verify_api.ps1
   ```
4. **Run Automated Test Suite (30 Tests)**:
   ```bash
   dotnet test
   ```
