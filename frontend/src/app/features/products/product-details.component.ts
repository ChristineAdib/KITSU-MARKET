import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductDetails } from '../../core/models/product.models';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="product-details-page">
      <div class="container">
        
        <!-- Breadcrumb Navigation -->
        <nav class="breadcrumb-nav" aria-label="Breadcrumb">
          <a routerLink="/">Home</a>
          <span class="sep">/</span>
          <a routerLink="/shop">Shop</a>
          <span class="sep">/</span>
          @if (product()) {
            <a [routerLink]="['/shop']" [queryParams]="{ categoryId: product()!.categoryId }">
              {{ product()!.category.name }}
            </a>
            <span class="sep">/</span>
            <span class="current">{{ product()!.name }}</span>
          }
        </nav>

        @if (isLoading()) {
          <div class="details-skeleton-grid">
            <div class="skeleton" style="height: 520px;"></div>
            <div class="skeleton-content">
              <div class="skeleton" style="height: 30px; width: 40%; margin-bottom: 20px;"></div>
              <div class="skeleton" style="height: 48px; width: 85%; margin-bottom: 20px;"></div>
              <div class="skeleton" style="height: 36px; width: 30%; margin-bottom: 30px;"></div>
              <div class="skeleton" style="height: 120px; width: 100%; margin-bottom: 30px;"></div>
              <div class="skeleton" style="height: 50px; width: 60%;"></div>
            </div>
          </div>
        } @else if (errorMessage()) {
          <div class="error-container">
            <h2>Product Not Found</h2>
            <p>{{ errorMessage() }}</p>
            <a routerLink="/shop" class="btn btn-primary">Return to Shop</a>
          </div>
        } @else if (product()) {
          <div class="product-details-layout">
            
            <!-- Left: High-Res Product Image Showcase -->
            <div class="product-gallery">
              <div class="main-image-frame">
                <img 
                  [src]="product()!.imageUrl" 
                  [alt]="product()!.name" 
                  (error)="onImageError($event)"
                />
                @if (product()!.isFeatured) {
                  <span class="badge badge-featured gallery-badge">Featured Edition</span>
                }
              </div>
            </div>

            <!-- Right: Product Purchasing & Specs -->
            <div class="product-summary">
              
              <div class="category-meta">
                <a [routerLink]="['/shop']" [queryParams]="{ categoryId: product()!.categoryId }" class="cat-link">
                  {{ product()!.category.name }}
                </a>
                <span class="jp-tag">正規コレクターズアイテム</span>
              </div>

              <h1 class="details-title">{{ product()!.name }}</h1>

              <!-- Price & Stock Status -->
              <div class="price-stock-box">
                <div class="price-display">
                  <span class="currency">EGP</span>
                  <span class="amount">{{ product()!.price | number:'1.2-2' }}</span>
                </div>

                <div class="stock-badge-wrap">
                  @if (product()!.stockQuantity > 0) {
                    <span class="badge badge-instock">
                      In Stock ({{ product()!.stockQuantity }} available)
                    </span>
                  } @else {
                    <span class="badge badge-outstock">Currently Out of Stock</span>
                  }
                </div>
              </div>

              <!-- Product Description -->
              <div class="product-description">
                <h3>About This Piece</h3>
                <p>{{ product()!.description }}</p>
              </div>

              <!-- Purchasing Actions -->
              <div class="purchasing-panel">
                @if (product()!.stockQuantity > 0) {
                  
                  <div class="quantity-controller">
                    <label class="qty-label">Quantity</label>
                    <div class="qty-stepper">
                      <button 
                        type="button" 
                        class="stepper-btn" 
                        (click)="decrementQty()" 
                        [disabled]="selectedQuantity() <= 1"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span class="qty-value">{{ selectedQuantity() }}</span>
                      <button 
                        type="button" 
                        class="stepper-btn" 
                        (click)="incrementQty()" 
                        [disabled]="selectedQuantity() >= product()!.stockQuantity"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div class="action-buttons">
                    <button 
                      type="button" 
                      class="btn btn-primary btn-lg add-bag-btn" 
                      (click)="onAddToCart()"
                      [disabled]="isAddingToCart()"
                    >
                      @if (isAddingToCart()) {
                        <span class="btn-spinner"></span>
                        <span>Adding to Bag...</span>
                      } @else {
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        <span>Add to Shopping Bag • {{ (product()!.price * selectedQuantity()) | number:'1.2-2' }} EGP</span>
                      }
                    </button>
                  </div>

                } @else {
                  <div class="out-of-stock-alert">
                    <p>This collectible is currently sold out. Check back soon for stock replenishment.</p>
                    <a routerLink="/shop" class="btn btn-secondary">Explore Other Collectibles</a>
                  </div>
                }
              </div>

              <!-- Collector Guarantee Points -->
              <div class="collector-guarantee">
                <div class="guarantee-item">
                  <span class="item-icon">✓</span>
                  <span>Authentic merchandise curated for serious anime fans</span>
                </div>
                <div class="guarantee-item">
                  <span class="item-icon">✓</span>
                  <span>Carefully packed with archival protective padding</span>
                </div>
                <div class="guarantee-item">
                  <span class="item-icon">✓</span>
                  <span>Instant stock reservation upon order placement</span>
                </div>
              </div>

            </div>

          </div>
        }

      </div>
    </main>
  `,
  styles: [`
    .product-details-page {
      padding: 30px 0 80px;
    }
    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: var(--warm-taupe);
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .breadcrumb-nav a {
      color: var(--cocoa-brown);
      font-weight: 500;
    }
    .breadcrumb-nav a:hover {
      color: var(--vermilion);
    }
    .breadcrumb-nav .sep {
      color: var(--rose-mist);
    }
    .breadcrumb-nav .current {
      color: var(--vermilion);
      font-weight: 600;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-details-layout {
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      gap: 56px;
      align-items: start;
    }

    /* Left Gallery */
    .product-gallery {
      position: sticky;
      top: 90px;
    }
    .main-image-frame {
      position: relative;
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-lg);
      overflow: hidden;
      aspect-ratio: 1 / 1;
      box-shadow: var(--shadow-md);
    }
    .main-image-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .gallery-badge {
      position: absolute;
      top: 16px;
      left: 16px;
    }

    /* Right Summary */
    .product-summary {
      display: flex;
      flex-direction: column;
    }
    .category-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .cat-link {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--vermilion);
    }
    .cat-link:hover {
      text-decoration: underline;
    }
    .details-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      line-height: 1.2;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
    }

    /* Price Box */
    .price-stock-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      margin-bottom: 28px;
    }
    .price-display {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .price-display .currency {
      font-size: 1rem;
      font-weight: 800;
      color: var(--vermilion);
    }
    .price-display .amount {
      font-size: 2rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
    }

    /* Description */
    .product-description {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--rose-mist);
    }
    .product-description h3 {
      font-size: 0.9375rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--cocoa-brown);
      margin-bottom: 10px;
    }
    .product-description p {
      font-size: 1rem;
      line-height: 1.65;
      color: var(--cocoa-brown);
      opacity: 0.9;
    }

    /* Purchasing Panel */
    .purchasing-panel {
      margin-bottom: 36px;
    }
    .quantity-controller {
      margin-bottom: 18px;
    }
    .qty-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--warm-taupe);
      margin-bottom: 8px;
    }
    .qty-stepper {
      display: inline-flex;
      align-items: center;
      border: 1.5px solid var(--rose-mist);
      border-radius: var(--radius-sm);
      background-color: var(--pure-white);
    }
    .stepper-btn {
      width: 44px;
      height: 44px;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--cocoa-brown);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--transition-fast);
    }
    .stepper-btn:hover:not(:disabled) {
      background-color: var(--sakura-blush);
      color: var(--vermilion);
    }
    .stepper-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .qty-value {
      width: 48px;
      text-align: center;
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--cocoa-brown);
    }
    .action-buttons {
      display: flex;
      gap: 16px;
    }
    .add-bag-btn {
      flex: 1;
    }
    .out-of-stock-alert {
      background-color: var(--sakura-blush);
      border: 1px solid var(--soft-peach);
      border-radius: var(--radius-md);
      padding: 24px;
      text-align: center;
    }
    .out-of-stock-alert p {
      color: var(--cocoa-brown);
      font-weight: 600;
      margin-bottom: 16px;
    }

    /* Guarantees */
    .collector-guarantee {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background-color: rgba(246, 221, 213, 0.4);
      border-radius: var(--radius-md);
      border: 1px dashed var(--soft-peach);
    }
    .guarantee-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.84375rem;
      color: var(--cocoa-brown);
      font-weight: 600;
    }
    .item-icon {
      color: var(--matcha-olive);
      font-weight: 800;
    }

    /* Skeleton & Error */
    .details-skeleton-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 56px;
    }
    .error-container {
      text-align: center;
      padding: 80px 24px;
    }
    .error-container h2 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin-bottom: 12px;
    }
    .error-container p {
      color: var(--warm-taupe);
      margin-bottom: 24px;
    }

    @media (max-width: 992px) {
      .product-details-layout, .details-skeleton-grid {
        grid-template-columns: 1fr;
        gap: 36px;
      }
      .product-gallery {
        position: static;
      }
      .details-title {
        font-size: 1.875rem;
      }
    }
  `]
})
export class ProductDetailsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product = signal<ProductDetails | null>(null);
  readonly selectedQuantity = signal<number>(1);
  readonly isLoading = signal<boolean>(true);
  readonly isAddingToCart = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProduct(id);
      } else {
        this.errorMessage.set('Invalid product ID.');
        this.isLoading.set(false);
      }
    });
  }

  loadProduct(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.selectedQuantity.set(1);

    this.productService.getProductById(id).subscribe({
      next: p => {
        this.product.set(p);
        this.isLoading.set(false);
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'This product is unavailable or does not exist.');
        this.isLoading.set(false);
      }
    });
  }

  incrementQty(): void {
    const currentProd = this.product();
    if (!currentProd) return;
    if (this.selectedQuantity() < currentProd.stockQuantity) {
      this.selectedQuantity.update(q => q + 1);
    }
  }

  decrementQty(): void {
    if (this.selectedQuantity() > 1) {
      this.selectedQuantity.update(q => q - 1);
    }
  }

  onAddToCart(): void {
    const currentProd = this.product();
    if (!currentProd || currentProd.stockQuantity <= 0) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/products/${currentProd.id}` }
      });
      return;
    }

    this.isAddingToCart.set(true);
    this.cartService.addItem(currentProd.id, this.selectedQuantity()).subscribe({
      next: () => this.isAddingToCart.set(false),
      error: () => this.isAddingToCart.set(false)
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'http://localhost:5232/uploads/luffy_gear5.jpg';
  }
}
