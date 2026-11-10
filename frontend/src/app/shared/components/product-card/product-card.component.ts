import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.models';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="product-card" [class.is-out-of-stock]="product.stockQuantity <= 0">
      
      <!-- Card Image Wrap -->
      <div class="product-image-wrap">
        <a [routerLink]="['/products', product.id]" class="image-link" [attr.aria-label]="product.name">
          <img 
            [src]="product.imageUrl" 
            [alt]="product.name" 
            loading="lazy"
            (error)="onImageError($event)"
          />
        </a>

        <!-- Badges -->
        <div class="card-badges">
          @if (product.isFeatured) {
            <span class="badge badge-featured">Featured</span>
          }
          @if (product.stockQuantity <= 0) {
            <span class="badge badge-outstock">Sold Out</span>
          } @else if (product.stockQuantity <= 5) {
            <span class="badge badge-lowstock">Only {{ product.stockQuantity }} Left</span>
          }
        </div>

        <!-- Quick Add Action -->
        @if (product.stockQuantity > 0) {
          <button 
            type="button" 
            class="quick-add-btn" 
            (click)="onAddToCart($event)"
            [disabled]="isAdding()"
            title="Add to Shopping Bag"
          >
            @if (isAdding()) {
              <span class="btn-spinner"></span>
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Add to Bag</span>
            }
          </button>
        }
      </div>

      <!-- Card Content -->
      <div class="product-info">
        <span class="product-category">{{ product.categoryName }}</span>
        <h3 class="product-title">
          <a [routerLink]="['/products', product.id]">{{ product.name }}</a>
        </h3>

        <div class="product-meta">
          <div class="product-price">
            <span class="currency">EGP</span>
            <span class="amount">{{ product.price | number:'1.2-2' }}</span>
          </div>
          <span class="stock-indicator" [class.in-stock]="product.stockQuantity > 0">
            {{ product.stockQuantity > 0 ? 'In Stock' : 'Unavailable' }}
          </span>
        </div>
      </div>

    </article>
  `,
  styles: [`
    .product-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
      position: relative;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(91, 68, 59, 0.08);
      border-color: var(--soft-peach);
    }
    .product-card.is-out-of-stock {
      opacity: 0.78;
    }
    .product-image-wrap {
      position: relative;
      aspect-ratio: 4 / 3.4;
      background-color: var(--porcelain);
      overflow: hidden;
    }
    .image-link {
      display: block;
      width: 100%;
      height: 100%;
    }
    .product-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .product-card:hover .product-image-wrap img {
      transform: scale(1.05);
    }
    .card-badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 2;
    }
    .quick-add-btn {
      position: absolute;
      bottom: 12px;
      right: 12px;
      left: 12px;
      background-color: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(4px);
      color: var(--cocoa-brown);
      border: 1px solid var(--rose-mist);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: var(--shadow-md);
      transform: translateY(10px);
      opacity: 0;
      transition: transform var(--transition-fast), opacity var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast);
      z-index: 3;
    }
    .product-card:hover .quick-add-btn {
      transform: translateY(0);
      opacity: 1;
    }
    .quick-add-btn:hover {
      background-color: var(--vermilion);
      color: var(--pure-white);
      border-color: var(--vermilion);
    }
    .product-info {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-category {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--warm-taupe);
      margin-bottom: 6px;
    }
    .product-title {
      font-size: 0.9375rem;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 12px;
      flex: 1;
    }
    .product-title a {
      color: var(--cocoa-brown);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .product-title a:hover {
      color: var(--vermilion);
    }
    .product-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--porcelain);
      padding-top: 10px;
    }
    .product-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .currency {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--vermilion);
    }
    .amount {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
    }
    .stock-indicator {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--warm-taupe);
    }
    .stock-indicator.in-stock {
      color: var(--matcha-olive);
    }
    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--rose-mist);
      border-top-color: var(--vermilion);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @media (hover: none) {
      .quick-add-btn {
        transform: translateY(0);
        opacity: 1;
        position: static;
        margin-top: 12px;
        background-color: var(--porcelain);
      }
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAdding = signal<boolean>(false);

  onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/shop' } });
      return;
    }

    this.isAdding.set(true);
    this.cartService.addItem(this.product.id, 1).subscribe({
      next: () => this.isAdding.set(false),
      error: () => this.isAdding.set(false)
    });
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80';
  }
}
