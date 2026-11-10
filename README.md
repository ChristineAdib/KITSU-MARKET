# KITSU MARKET — Anime Merchandise E-Commerce Platform
## Phase 1: Backend Foundation, Database, Authentication & Product Management

### Overview
KITSU MARKET is an anime merchandise e-commerce platform built with ASP.NET Core 8 Web API, Entity Framework Core, Microsoft SQL Server, and ASP.NET Core Identity with JWT Bearer Authentication and Role-Based Access Control (RBAC).

---

### Technical Stack
- **Framework**: ASP.NET Core 8 Web API (`net8.0`)
- **Language**: C# 12
- **Database**: Microsoft SQL Server 2022
- **ORM**: Entity Framework Core 8.0 (Code-First with Migrations)
- **Identity & Security**: ASP.NET Core Identity & JWT Bearer Tokens (`System.IdentityModel.Tokens.Jwt`)
- **API Documentation**: Swagger / OpenAPI with Bearer Authorization (`Swashbuckle.AspNetCore`)
- **Testing**: xUnit, `Microsoft.AspNetCore.Mvc.Testing` (Integration Test Suite)

---

### Solution Architecture
```
InternTask4/
├── KitsuMarket.sln
├── .gitignore
├── README.md
├── scripts/
│   └── verify_api.ps1               # Live automated verification script
├── src/
│   └── KitsuMarket.API/             # ASP.NET Core Web API Project
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── CategoriesController.cs
│       │   └── ProductsController.cs
│       ├── Common/
│       │   └── SlugHelper.cs        # URL-friendly slug generation
│       ├── Data/
│       │   ├── ApplicationDbContext.cs
│       │   ├── Entities/
│       │   │   ├── ApplicationUser.cs
│       │   │   ├── Category.cs
│       │   │   └── Product.cs
│       │   ├── EntityConfigurations/
│       │   │   ├── CategoryConfiguration.cs
│       │   │   └── ProductConfiguration.cs
│       │   ├── Migrations/
│       │   └── Seed/
│       │       └── DbInitializer.cs # Role, Admin, Category & Product seed
│       ├── DTOs/
│       │   ├── Auth/
│       │   ├── Categories/
│       │   ├── Products/
│       │   └── Common/
│       ├── Middleware/
│       │   └── ExceptionHandlingMiddleware.cs
│       ├── Services/
│       │   ├── ITokenService.cs
│       │   └── TokenService.cs
│       ├── appsettings.json
│       ├── appsettings.Development.json
│       └── Program.cs
└── tests/
    └── KitsuMarket.Tests/           # Automated Integration Test Suite (16 tests)
        ├── AuthTests.cs
        ├── CategoryTests.cs
        ├── ProductTests.cs
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

---

### API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register customer (auto-assigns `Customer` role) |
| `POST` | `/api/auth/login` | Public | Authenticate user & return signed JWT |
| `GET` | `/api/auth/me` | Authenticated | Return authenticated profile & role claims |

#### Categories (`/api/categories`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List categories with active product count |
| `GET` | `/api/categories/{id}` | Public | Get category details by ID |
| `POST` | `/api/categories` | Admin Only | Create new category (auto-slug generation) |
| `PUT` | `/api/categories/{id}` | Admin Only | Update category name & image |
| `DELETE` | `/api/categories/{id}` | Admin Only | Delete empty category (blocks if products exist) |

#### Products (`/api/products`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | Paginated active products (search, category, price range, featured, sort) |
| `GET` | `/api/products/{id}` | Public | Get product details (returns 404 if deactivated) |
| `POST` | `/api/products` | Admin Only | Create product with unique slug |
| `PUT` | `/api/products/{id}` | Admin Only | Update product details |
| `DELETE` | `/api/products/{id}` | Admin Only | Soft-deactivate product (`IsActive = false`) |

---

### How to Run the Backend

1. **Verify Prerequisites**:
   - .NET 8 SDK
   - SQL Server (running locally or accessible via connection string)

2. **Database Migration & Startup**:
   Migrations and seed data apply automatically on startup:
   ```bash
   dotnet run --project src/KitsuMarket.API/KitsuMarket.API.csproj
   ```
   Or apply migrations manually:
   ```bash
   dotnet ef database update --project src/KitsuMarket.API/KitsuMarket.API.csproj --startup-project src/KitsuMarket.API/KitsuMarket.API.csproj
   ```

3. **Access Swagger UI**:
   Open: [http://localhost:5232/swagger](http://localhost:5232/swagger)
   Click **Authorize** and input: `Bearer <jwt_token>`

4. **Default Development Admin Credentials**:
   - **Email**: `admin@kitsumarket.com`
   - **Password**: `Admin@KitsuMarket2026!`
   *(Configured in `appsettings.Development.json`; in production, credentials are supplied via environment variables `AdminUser__Email` and `AdminUser__Password`)*

---

### Running Tests
To run all 16 automated integration tests:
```bash
dotnet test
```

To run the live HTTP verification script against a running server:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify_api.ps1
```
