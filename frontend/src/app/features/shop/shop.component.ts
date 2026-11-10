import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Category, PagedResult, Product, ProductQuery } from '../../core/models/product.models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <main class="shop-page">
      <div class="container">
        
        <!-- Shop Header -->
        <header class="shop-header">
          <div class="header-left">
            <span class="jp-tag">商品カタログ</span>
            <h1 class="page-title">
              @if (selectedCategoryName()) {
                {{ selectedCategoryName() }}
              } @else if (search()) {
                Results for "{{ search() }}"
              } @else {
                All Anime Collectibles
              }
            </h1>
            <p class="results-count">
              Showing {{ productsResult()?.totalCount || 0 }} items available in Egypt (EGP)
            </p>
          </div>

          <!-- Sort Bar -->
          <div class="header-right">
            <div class="sort-wrapper">
              <label for="sortSelect" class="sort-label">Sort by:</label>
              <select id="sortSelect" [ngModel]="sortBy()" (ngModelChange)="onSortChange($event)">
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </header>

        <!-- Main Layout: Sidebar Filters + Products Grid -->
        <div class="shop-layout">
          
          <!-- Filters Sidebar -->
          <aside class="filters-sidebar">
            <div class="filter-card">
              <div class="filter-header">
                <h3>Filters</h3>
                @if (hasActiveFilters()) {
                  <button type="button" class="clear-filters-btn" (click)="clearFilters()">
                    Reset
                  </button>
                }
              </div>

              <!-- Search Filter -->
              <div class="filter-section">
                <label class="filter-title" for="searchInput">Search Keywords</label>
                <div class="search-input-wrap">
                  <input 
                    id="searchInput"
                    type="text" 
                    placeholder="E.g. Figure, Hoodie, Charm..." 
                    [ngModel]="search()" 
                    (ngModelChange)="onSearchChange($event)"
                  />
                </div>
              </div>

              <!-- Category Filter -->
              <div class="filter-section">
                <span class="filter-title">Category</span>
                <div class="category-list">
                  <button 
                    type="button" 
                    class="cat-chip" 
                    [class.active]="!selectedCategoryId()"
                    (click)="onCategorySelect(undefined)"
                  >
                    All Categories
                  </button>
                  @for (cat of categories(); track cat.id) {
                    <button 
                      type="button" 
                      class="cat-chip" 
                      [class.active]="selectedCategoryId() === cat.id"
                      (click)="onCategorySelect(cat.id)"
                    >
                      <span>{{ cat.name }}</span>
                      <span class="chip-count">({{ cat.productCount }})</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Price Range Filter -->
              <div class="filter-section">
                <span class="filter-title">Price Range (EGP)</span>
                <div class="price-inputs">
                  <div class="price-field">
                    <span class="prefix">Min</span>
                    <input 
                      type="number" 
                      min="0" 
                      placeholder="0" 
                      [ngModel]="minPrice()" 
                      (ngModelChange)="onMinPriceChange($event)"
                    />
                  </div>
                  <span class="price-sep">-</span>
                  <div class="price-field">
                    <span class="prefix">Max</span>
                    <input 
                      type="number" 
                      min="0" 
                      placeholder="5000" 
                      [ngModel]="maxPrice()" 
                      (ngModelChange)="onMaxPriceChange($event)"
                    />
                  </div>
                </div>
              </div>

              <!-- Featured Only Toggle -->
              <div class="filter-section">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [checked]="isFeatured() === true" 
                    (change)="onFeaturedToggle($event)"
                  />
                  <span>Featured Items Only</span>
                </label>
              </div>

            </div>
          </aside>

          <!-- Products Content Area -->
          <section class="products-area">
            
            @if (isLoading()) {
              <div class="products-grid">
                @for (item of [1,2,3,4,5,6]; track item) {
                  <div class="skeleton" style="height: 380px;"></div>
                }
              </div>
            } @else if (errorMessage()) {
              <div class="error-state">
                <p class="error-msg">{{ errorMessage() }}</p>
                <button type="button" class="btn btn-secondary btn-sm" (click)="loadProducts()">Retry</button>
              </div>
            } @else if (!productsResult()?.items?.length) {
              <!-- Empty Search / Filter State -->
              <div class="empty-state">
                <div class="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <h3>No Collectibles Found</h3>
                <p>We couldn't find any products matching your current filters or keywords.</p>
                <button type="button" class="btn btn-primary btn-sm" (click)="clearFilters()">
                  Clear All Filters
                </button>
              </div>
            } @else {
              <!-- Product Grid -->
              <div class="products-grid">
                @for (product of productsResult()?.items; track product.id) {
                  <app-product-card [product]="product" />
                }
              </div>

              <!-- Pagination Controls -->
              @if (productsResult()!.totalPages > 1) {
                <div class="pagination-bar">
                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm page-btn" 
                    [disabled]="!productsResult()?.hasPreviousPage"
                    (click)="onPageChange(page() - 1)"
                  >
                    &larr; Previous
                  </button>

                  <div class="page-numbers">
                    Page <strong>{{ page() }}</strong> of <strong>{{ productsResult()?.totalPages }}</strong>
                  </div>

                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm page-btn" 
                    [disabled]="!productsResult()?.hasNextPage"
                    (click)="onPageChange(page() + 1)"
                  >
                    Next &rarr;
                  </button>
                </div>
              }
            }

          </section>

        </div>

      </div>
    </main>
  `,
  styles: [`
    .shop-page {
      padding: 40px 0 80px;
    }
    .shop-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--rose-mist);
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
      margin: 4px 0 6px;
    }
    .results-count {
      font-size: 0.875rem;
      color: var(--warm-taupe);
      font-weight: 500;
    }
    .sort-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sort-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--warm-taupe);
    }
    .sort-wrapper select {
      padding: 8px 14px;
      font-size: 0.875rem;
      border: 1.5px solid var(--rose-mist);
      border-radius: var(--radius-sm);
      background-color: var(--pure-white);
      color: var(--cocoa-brown);
      font-weight: 600;
      cursor: pointer;
    }
    .sort-wrapper select:focus {
      outline: none;
      border-color: var(--vermilion);
    }

    /* Layout */
    .shop-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 36px;
      align-items: start;
    }

    /* Filters Sidebar */
    .filter-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 90px;
    }
    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--porcelain);
    }
    .filter-header h3 {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--cocoa-brown);
    }
    .clear-filters-btn {
      font-size: 0.78125rem;
      font-weight: 700;
      color: var(--vermilion);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .clear-filters-btn:hover {
      color: var(--deep-cherry);
      text-decoration: underline;
    }
    .filter-section {
      margin-bottom: 24px;
    }
    .filter-title {
      display: block;
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--warm-taupe);
      margin-bottom: 10px;
    }
    .search-input-wrap input {
      width: 100%;
      padding: 10px 14px;
      font-size: 0.84375rem;
      border: 1.5px solid var(--rose-mist);
      border-radius: var(--radius-sm);
      background-color: var(--porcelain);
    }
    .search-input-wrap input:focus {
      outline: none;
      border-color: var(--vermilion);
      background-color: var(--pure-white);
    }
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .cat-chip {
      text-align: left;
      padding: 8px 12px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--cocoa-brown);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background-color var(--transition-fast), color var(--transition-fast);
    }
    .cat-chip:hover {
      background-color: var(--porcelain);
      color: var(--vermilion);
    }
    .cat-chip.active {
      background-color: var(--sakura-blush);
      color: var(--vermilion);
      font-weight: 700;
    }
    .chip-count {
      font-size: 0.75rem;
      color: var(--warm-taupe);
    }
    .price-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .price-field {
      flex: 1;
      display: flex;
      align-items: center;
      border: 1.5px solid var(--rose-mist);
      border-radius: var(--radius-sm);
      background-color: var(--porcelain);
      padding: 0 8px;
    }
    .price-field .prefix {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--warm-taupe);
      margin-right: 4px;
    }
    .price-field input {
      width: 100%;
      border: none;
      background: none;
      padding: 8px 0;
      font-size: 0.84375rem;
      font-weight: 600;
      color: var(--cocoa-brown);
    }
    .price-field input:focus {
      outline: none;
    }
    .price-sep {
      color: var(--warm-taupe);
      font-weight: bold;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--cocoa-brown);
      cursor: pointer;
    }
    .checkbox-label input {
      accent-color: var(--vermilion);
      width: 16px;
      height: 16px;
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
    }

    /* Empty State */
    .empty-state {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      padding: 60px 24px;
      text-align: center;
      margin: 20px 0;
    }
    .empty-icon {
      color: var(--warm-taupe);
      margin-bottom: 16px;
    }
    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin-bottom: 8px;
    }
    .empty-state p {
      color: var(--warm-taupe);
      font-size: 0.9375rem;
      max-width: 400px;
      margin: 0 auto 20px;
    }

    /* Pagination */
    .pagination-bar {
      margin-top: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }
    .page-numbers {
      font-size: 0.875rem;
      color: var(--cocoa-brown);
    }

    /* Error State */
    .error-state {
      padding: 40px;
      text-align: center;
    }
    .error-msg {
      color: var(--deep-cherry);
      margin-bottom: 12px;
      font-weight: 600;
    }

    @media (max-width: 992px) {
      .shop-layout {
        grid-template-columns: 1fr;
      }
      .filter-card {
        position: static;
      }
    }
  `]
})
export class ShopComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly productsResult = signal<PagedResult<Product> | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Filters state
  readonly search = signal<string>('');
  readonly selectedCategoryId = signal<number | undefined>(undefined);
  readonly minPrice = signal<number | undefined>(undefined);
  readonly maxPrice = signal<number | undefined>(undefined);
  readonly isFeatured = signal<boolean | undefined>(undefined);
  readonly sortBy = signal<string>('newest');
  readonly page = signal<number>(1);
  readonly pageSize = 12;

  ngOnInit(): void {
    // 1. Load categories
    this.productService.getCategories().subscribe({
      next: cats => this.categories.set(cats)
    });

    // 2. Listen to query params
    this.route.queryParams.subscribe(params => {
      this.search.set(params['search'] || '');
      this.selectedCategoryId.set(params['categoryId'] ? Number(params['categoryId']) : undefined);
      this.minPrice.set(params['minPrice'] ? Number(params['minPrice']) : undefined);
      this.maxPrice.set(params['maxPrice'] ? Number(params['maxPrice']) : undefined);
      this.isFeatured.set(params['isFeatured'] === 'true' ? true : undefined);
      this.sortBy.set(params['sortBy'] || 'newest');
      this.page.set(params['page'] ? Number(params['page']) : 1);

      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const query: ProductQuery = {
      search: this.search() || undefined,
      categoryId: this.selectedCategoryId(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
      isFeatured: this.isFeatured(),
      sortBy: this.sortBy(),
      page: this.page(),
      pageSize: this.pageSize
    };

    this.productService.getProducts(query).subscribe({
      next: result => {
        this.productsResult.set(result);
        this.isLoading.set(false);
      },
      error: err => {
        this.errorMessage.set('Failed to load products. Please check your connection.');
        this.isLoading.set(false);
      }
    });
  }

  selectedCategoryName(): string | null {
    const catId = this.selectedCategoryId();
    if (!catId) return null;
    const cat = this.categories().find(c => c.id === catId);
    return cat ? cat.name : null;
  }

  hasActiveFilters(): boolean {
    return !!(
      this.search() ||
      this.selectedCategoryId() ||
      this.minPrice() !== undefined ||
      this.maxPrice() !== undefined ||
      this.isFeatured() !== undefined ||
      this.sortBy() !== 'newest'
    );
  }

  clearFilters(): void {
    this.router.navigate(['/shop'], {
      queryParams: {}
    });
  }

  onCategorySelect(catId?: number): void {
    this.updateQuery({ categoryId: catId, page: 1 });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.updateQuery({ search: value.trim() || null, page: 1 });
  }

  onMinPriceChange(val: number): void {
    this.updateQuery({ minPrice: val || null, page: 1 });
  }

  onMaxPriceChange(val: number): void {
    this.updateQuery({ maxPrice: val || null, page: 1 });
  }

  onFeaturedToggle(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.updateQuery({ isFeatured: isChecked ? 'true' : null, page: 1 });
  }

  onSortChange(sort: string): void {
    this.updateQuery({ sortBy: sort, page: 1 });
  }

  onPageChange(newPage: number): void {
    this.updateQuery({ page: newPage });
  }

  private updateQuery(newParams: Record<string, any>): void {
    this.router.navigate(['/shop'], {
      queryParams: newParams,
      queryParamsHandling: 'merge'
    });
  }
}
