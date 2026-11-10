# KITSU MARKET — Anime Merchandise E-Commerce Platform
## Full-Stack: ASP.NET Core 8 Web API & Angular 20 Standalone Frontend

### 1. Project Overview
**KITSU MARKET** is a complete, enterprise-grade anime merchandise e-commerce platform featuring a modern **TOKYO POP EDITORIAL** brand identity. It provides authentic collectibles, scale figures, manga, apparel, and lifestyle goods with real-time inventory management, atomic checkout, customer order tracking, and a comprehensive admin control center.

- **Phase 1**: Backend foundation, SQL Server database, ASP.NET Core Identity, JWT authentication, and product catalog APIs.
- **Phase 2**: Shopping cart, atomic checkout, inventory controls, customer orders, and admin order fulfillment.
- **Phase 3**: Complete Angular 20 frontend with Standalone Components, Signals, reactive cart synchronization, role-protected routes, and a custom design system adhering strictly to the Tokyo Pop Editorial aesthetic.

---

### 2. Architecture & Technology Stack

#### Backend
- **Framework**: ASP.NET Core 8 Web API (`net8.0`)
- **Language**: C# 12
- **Database**: Microsoft SQL Server 2022 (EF Core 8 Code-First with Migrations)
- **Security**: ASP.NET Core Identity & JWT Bearer Authentication (`System.IdentityModel.Tokens.Jwt`)
- **Documentation**: Swagger / OpenAPI with Bearer Authorization (`Swashbuckle.AspNetCore`)
- **Testing**: xUnit, `Microsoft.AspNetCore.Mvc.Testing` (30 integration tests)

#### Frontend
- **Framework**: Angular 20 (`@angular/core` 20.3.24) with Node.js v24
- **Architecture**: 100% Standalone Components & Functional Guards/Interceptors
- **State Management**: Angular Signals (`signal`, `computed`, `effect`)
- **HTTP**: `provideHttpClient` with functional `authInterceptor` (automatic Bearer injection and 401 handling)
- **Routing**: Angular Router with View Transitions, Scroll Restoration, and Title strategies
- **Design System**: Custom Tokyo Pop Editorial CSS system (Zero Bootstrap/Tailwind bloat, fully responsive)

---

### 3. Tokyo Pop Editorial Brand Identity

#### Strict Color Palette
All user-facing surfaces strictly adhere to the brand guidelines (no black, blue, purple, or neon hues):
- **Porcelain White** (`#FFF8F4`): Primary warm background
- **Pure White** (`#FFFFFF`): Surfaces, cards, and input backgrounds
- **Sakura Blush** (`#F6DDD5`): Category badges, soft accent tags, and hover highlights
- **Japanese Vermilion** (`#D94D3F`): Primary CTA, action buttons, and active indicators
- **Deep Cherry** (`#B83F35`): Button hover states, bold headings, and Japanese editorial accents
- **Soft Peach** (`#F0B29A`): Borders, secondary badges, and subtle dividers
- **Matcha Olive** (`#92996B`): In-stock status, positive notifications, and completed timeline steps
- **Butter Yellow** (`#F2D27A`): Featured badges and rating tags
- **Cocoa Brown** (`#5B443B`): Universal primary text and dark elements (**No black used**)
- **Warm Taupe** (`#8F7B72`): Secondary text, subtitles, and form labels
- **Rose Mist** (`#E9D7D1`): Card borders and table dividers

#### Typography
- **Primary & Headings**: `Manrope` / `DM Sans`
- **Japanese Editorial Subtitles**: `Noto Sans JP` (`注文履歴`, `管理ポータル`, `キツ・マーケット`)

---

### 4. Repository Structure

```
InternTask4/
├── KitsuMarket.slnx                 # .NET Solution file
├── README.md                        # Complete platform documentation
├── scripts/
│   └── verify_api.ps1               # Automated 23-step backend integration test
├── src/
│   └── KitsuMarket.API/             # ASP.NET Core 8 Web API
│       ├── Common/                  # SlugHelper and utility methods
│       ├── Controllers/             # Auth, Products, Categories, Cart, Orders, AdminOrders
│       ├── Data/                    # DbContext, Entities, EntityConfigurations, Seed
│       ├── DTOs/                    # Request & Response DTOs
│       ├── Middleware/              # Global Exception Handling Middleware
│       └── Services/                # TokenService (JWT signing & validation)
├── tests/
│   └── KitsuMarket.Tests/           # Integration Test Suite (30 passing tests)
└── frontend/                        # Angular 20 Standalone Application
    ├── src/
    │   ├── app/
    │   │   ├── core/
    │   │   │   ├── guards/          # authGuard, adminGuard
    │   │   │   ├── interceptors/   # authInterceptor (Bearer token injection)
    │   │   │   ├── models/          # Auth, Product, Cart, and Order interfaces
    │   │   │   └── services/        # AuthService, CartService, ProductService, OrderService, AdminOrderService, ToastService
    │   │   ├── features/
    │   │   │   ├── account/         # Customer profile and shortcut hub
    │   │   │   ├── admin/           # Role-protected Admin Dashboard (Overview, Products, Orders, Categories)
    │   │   │   ├── auth/            # Split-screen Login and Registration pages
    │   │   │   ├── cart/            # Interactive Cart with quantity steppers and subtotal
    │   │   │   ├── checkout/        # Atomic order creation with shipping address
    │   │   │   ├── home/            # Editorial Tokyo Pop storefront homepage
    │   │   │   ├── orders/          # Order Confirmation, Order History, and Order Details
    │   │   │   ├── products/        # Product Details with stock selectors & Add to Cart
    │   │   │   └── shop/            # Catalog with live search, category, price, and sort filters
    │   │   └── shared/
    │   │       └── components/      # AnnouncementBar, Navbar, Footer, ProductCard, ToastContainer, InitialLoader
    │   ├── environments/            # Dev & Prod API URL configurations
    │   └── styles.css               # Global Tokyo Pop Editorial design system
    └── angular.json
```

---

### 5. Running the Application

#### Prerequisites
- .NET 8.0 SDK or higher
- Microsoft SQL Server (LocalDB or full instance running locally)
- Node.js (v18+ or v24+) & npm

#### Step 1: Start the Backend Web API
```bash
cd src/KitsuMarket.API
dotnet run
```
The backend starts at `http://localhost:5232` (Swagger UI available at `http://localhost:5232/swagger`).
*Note: The database `KitsuMarketDb` is automatically created, migrated, and seeded on initial run.*

#### Step 2: Start the Angular Frontend
```bash
cd frontend
npm install   # If not already installed
npm start     # Runs on http://localhost:4200
```
Visit `http://localhost:4200` in your web browser.

#### Step 3: Run the Automated Test Suites
- **Backend Tests (30/30 Passing)**:
  ```bash
  dotnet test tests/KitsuMarket.Tests/KitsuMarket.Tests.csproj --no-build
  ```
- **Backend Verification Script (23/23 Passing)**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/verify_api.ps1
  ```
- **Frontend Production Build**:
  ```bash
  cd frontend
  npm run build
  ```

---

### 6. Default Credentials & Roles

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@kitsumarket.com` | `Admin@KitsuMarket2026!` | Full product & category CRUD, status transitions, all orders |
| **Customer** | *(Self-register via `/register`)* | *(Configured at signup)* | Browse catalog, personal cart, checkout, personal orders |

---

### 7. Key Features Implemented

#### 1. Public Storefront
- **Announcement Bar**: Slim promotional banner with Japanese editorial styling.
- **Header & Navbar**: Sticky header with brand logo, collection links, search input, live cart badge counter, and authenticated user dropdown.
- **Hero Showcase**: Magazine-grade hero layout featuring featured drops and direct catalog CTAs.
- **Category Highlights**: Curated cards with real product counts for figures, apparel, manga, plushies, and accessories.
- **Product Details**: High-resolution image view, description, live stock counters, quantity limits, and Add-to-Cart with reactive toast alerts.
- **Catalog Filtering**: Instant client & server-side category filtering, search queries, min/max price sliders, and sorting options.

#### 2. Shopping Cart & Atomic Checkout
- **Reactive Cart**: Syncs directly with backend cart endpoints (`/api/cart`), persisting items across user sessions.
- **Quantity Steppers**: Enforces stock caps directly from the database.
- **Checkout Process**: Collects shipping address and recipient contact details, calculates server-verified totals, commits an atomic EF Core transaction deducting stock, clears the cart, and redirects to Order Confirmation.
- **Zero Fake Payment Gateways**: Respects strict project guidelines by using a realistic, clear order confirmation flow.

#### 3. Order Management & Tracking
- **Order History**: Displays order identifier, creation date, item count, formatted Egyptian Pound (EGP) total, and status badge.
- **Order Details**: Interactive fulfillment timeline step-tracker (`Pending` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered`), order item snapshots, and delivery address.

#### 4. Admin Control Center (`/admin`)
- **Overview Metrics**: Total products, active vs deactivated inventory, pending order fulfillment queue, and total gross revenue.
- **Product Management**: Full table of catalog merchandise with quick search, category filtering, "Add Product" and "Edit Product" modal dialogs, and instant activation/deactivation.
- **Order Management**: Global view of all customer orders with instant status transition dropdowns (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
- **Category Management**: Create, edit, and safely delete empty categories.

---

### 8. Verification & Quality Assurance

- **Build Integrity**: Clean Angular 20 build with zero compilation errors and budget compliance.
- **Backend Integration**: 100% test coverage across authentication, authorization, cart, catalog, and atomic order creation.
- **Design Authenticity**: Strictly verified color palette, responsive mobile layouts, accessible ARIA attributes, and cohesive Tokyo Pop Editorial visual identity.
