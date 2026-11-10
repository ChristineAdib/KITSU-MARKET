import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem } from '../../core/models/cart.models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="cart-page">
      <div class="container">
        
        <header class="cart-header">
          <div>
            <span class="jp-tag">ショッピングバッグ</span>
            <h1 class="page-title">Shopping Bag</h1>
          </div>
          @if (cartService.cart() && cartService.cart()!.items.length > 0) {
            <button type="button" class="clear-cart-link" (click)="onClearCart()">
              Clear Bag
            </button>
          }
        </header>

        @if (!authService.isAuthenticated()) {
          <div class="cart-auth-notice">
            <div class="notice-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>Sign In to View Your Shopping Bag</h3>
            <p>Your bag is safely attached to your personal customer account.</p>
            <a routerLink="/login" [queryParams]="{ returnUrl: '/cart' }" class="btn btn-primary">
              Sign In to Account
            </a>
          </div>
        } @else if (cartService.isLoading() && !cartService.cart()) {
          <div class="skeleton-cart">
            <div class="skeleton" style="height: 100px; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 100px; margin-bottom: 16px;"></div>
            <div class="skeleton" style="height: 100px;"></div>
          </div>
        } @else if (!cartService.cart() || cartService.cart()!.items.length === 0) {
          <!-- Empty Cart State -->
          <div class="empty-cart-card">
            <div class="empty-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h2>Your Shopping Bag is Empty</h2>
            <p>You haven't selected any anime collectibles or apparel yet. Explore our curated collections to find your next centerpiece.</p>
            <a routerLink="/shop" class="btn btn-primary btn-lg">
              Explore Collections
            </a>
          </div>
        } @else {
          <!-- Active Cart Layout -->
          <div class="cart-layout">
            
            <!-- Items Table/List -->
            <div class="cart-items-column">
              <div class="items-card">
                
                <div class="items-header">
                  <span class="col-head">Item Details</span>
                  <span class="col-head text-center">Unit Price</span>
                  <span class="col-head text-center">Quantity</span>
                  <span class="col-head text-right">Line Total</span>
                </div>

                <div class="items-body">
                  @for (item of cartService.cart()!.items; track item.productId) {
                    <div class="cart-item-row" [class.item-unavailable]="!item.isAvailable">
                      
                      <!-- Product Info -->
                      <div class="item-product-col">
                        <a [routerLink]="['/products', item.productId]" class="item-img-link">
                          <img [src]="item.productImageUrl" [alt]="item.productName" />
                        </a>
                        <div class="item-details">
                          <h4 class="item-name">
                            <a [routerLink]="['/products', item.productId]">{{ item.productName }}</a>
                          </h4>
                          @if (!item.isAvailable) {
                            <span class="item-warning">Only {{ item.stockQuantity }} in stock</span>
                          }
                          <button type="button" class="remove-btn" (click)="onRemoveItem(item.productId)">
                            Remove
                          </button>
                        </div>
                      </div>

                      <!-- Unit Price -->
                      <div class="item-price-col">
                        <span class="mobile-label">Price:</span>
                        <span class="unit-price">{{ item.unitPrice | number:'1.2-2' }} EGP</span>
                      </div>

                      <!-- Quantity Stepper -->
                      <div class="item-qty-col">
                        <span class="mobile-label">Quantity:</span>
                        <div class="qty-stepper">
                          <button 
                            type="button" 
                            class="stepper-btn" 
                            (click)="onUpdateQty(item, item.quantity - 1)"
                            [disabled]="item.quantity <= 1 || cartService.isLoading()"
                          >
                            -
                          </button>
                          <span class="qty-num">{{ item.quantity }}</span>
                          <button 
                            type="button" 
                            class="stepper-btn" 
                            (click)="onUpdateQty(item, item.quantity + 1)"
                            [disabled]="item.quantity >= item.stockQuantity || cartService.isLoading()"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <!-- Line Total -->
                      <div class="item-total-col">
                        <span class="mobile-label">Total:</span>
                        <span class="line-total">{{ item.lineTotal | number:'1.2-2' }} EGP</span>
                      </div>

                    </div>
                  }
                </div>

                <div class="items-footer">
                  <a routerLink="/shop" class="btn btn-secondary btn-sm">
                    &larr; Continue Shopping
                  </a>
                </div>

              </div>
            </div>

            <!-- Order Summary Column -->
            <div class="cart-summary-column">
              <div class="summary-card">
                <h3 class="summary-title">Order Summary</h3>

                <div class="summary-row">
                  <span class="row-label">Total Items:</span>
                  <span class="row-val">{{ cartService.itemCount() }}</span>
                </div>

                <div class="summary-row">
                  <span class="row-label">Subtotal:</span>
                  <span class="row-val">{{ cartService.totalAmount() | number:'1.2-2' }} EGP</span>
                </div>

                <div class="summary-row">
                  <span class="row-label">Standard Delivery:</span>
                  <span class="row-val free-tag">Calculated at Checkout</span>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-row total-row">
                  <span class="row-label">Estimated Total:</span>
                  <span class="total-amount">{{ cartService.totalAmount() | number:'1.2-2' }} EGP</span>
                </div>

                <p class="summary-note">All prices in Egyptian Pounds (EGP). Taxes included where applicable.</p>

                <a routerLink="/checkout" class="btn btn-primary btn-lg checkout-btn">
                  <span>Proceed to Checkout</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              </div>
            </div>

          </div>
        }

      </div>
    </main>
  `,
  styles: [`
    .cart-page {
      padding: 40px 0 80px;
    }
    .cart-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--rose-mist);
    }
    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
      margin-top: 4px;
    }
    .clear-cart-link {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--deep-cherry);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .clear-cart-link:hover {
      text-decoration: underline;
    }

    /* Auth Notice & Empty State */
    .cart-auth-notice, .empty-cart-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-lg);
      padding: 70px 24px;
      text-align: center;
      max-width: 600px;
      margin: 40px auto;
      box-shadow: var(--shadow-sm);
    }
    .notice-icon, .empty-icon {
      color: var(--vermilion);
      margin-bottom: 16px;
    }
    .empty-cart-card h2, .cart-auth-notice h3 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin-bottom: 10px;
    }
    .empty-cart-card p, .cart-auth-notice p {
      font-size: 0.9375rem;
      color: var(--warm-taupe);
      line-height: 1.6;
      margin-bottom: 28px;
    }

    /* Active Cart Layout */
    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 36px;
      align-items: start;
    }

    /* Items Card */
    .items-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .items-header {
      display: grid;
      grid-template-columns: 2.5fr 1fr 1.2fr 1.2fr;
      padding: 16px 24px;
      background-color: var(--porcelain);
      border-bottom: 1px solid var(--rose-mist);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--warm-taupe);
    }
    .col-head.text-center { text-align: center; }
    .col-head.text-right { text-align: right; }

    .items-body {
      divide-y: 1px solid var(--porcelain);
    }
    .cart-item-row {
      display: grid;
      grid-template-columns: 2.5fr 1fr 1.2fr 1.2fr;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--porcelain);
    }
    .item-product-col {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .item-img-link {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background-color: var(--porcelain);
      border: 1px solid var(--rose-mist);
      flex-shrink: 0;
    }
    .item-img-link img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .item-name {
      font-size: 0.9375rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .item-name a {
      color: var(--cocoa-brown);
    }
    .item-name a:hover {
      color: var(--vermilion);
    }
    .item-warning {
      display: block;
      font-size: 0.75rem;
      color: var(--vermilion);
      font-weight: 700;
      margin-bottom: 4px;
    }
    .remove-btn {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--deep-cherry);
    }
    .remove-btn:hover {
      text-decoration: underline;
    }
    .item-price-col {
      text-align: center;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--cocoa-brown);
    }
    .item-qty-col {
      display: flex;
      justify-content: center;
    }
    .qty-stepper {
      display: inline-flex;
      align-items: center;
      border: 1.5px solid var(--rose-mist);
      border-radius: var(--radius-sm);
      background-color: var(--pure-white);
    }
    .stepper-btn {
      width: 32px;
      height: 32px;
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--cocoa-brown);
    }
    .stepper-btn:hover:not(:disabled) {
      background-color: var(--sakura-blush);
      color: var(--vermilion);
    }
    .stepper-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .qty-num {
      width: 34px;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--cocoa-brown);
    }
    .item-total-col {
      text-align: right;
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--vermilion);
    }
    .mobile-label {
      display: none;
    }
    .items-footer {
      padding: 16px 24px;
      background-color: var(--pure-white);
    }

    /* Summary Card */
    .summary-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      padding: 28px;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 90px;
    }
    .summary-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--porcelain);
    }
    .summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 0.90625rem;
    }
    .row-label {
      color: var(--warm-taupe);
      font-weight: 500;
    }
    .row-val {
      color: var(--cocoa-brown);
      font-weight: 700;
    }
    .free-tag {
      font-size: 0.75rem;
      color: var(--matcha-olive);
      font-weight: 700;
    }
    .summary-divider {
      height: 1px;
      background-color: var(--rose-mist);
      margin: 18px 0;
    }
    .total-row {
      margin-bottom: 6px;
    }
    .total-row .row-label {
      font-size: 1rem;
      font-weight: 800;
      color: var(--cocoa-brown);
    }
    .total-amount {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--vermilion);
    }
    .summary-note {
      font-size: 0.75rem;
      color: var(--warm-taupe);
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .checkout-btn {
      width: 100%;
    }

    @media (max-width: 868px) {
      .cart-layout {
        grid-template-columns: 1fr;
      }
      .items-header {
        display: none;
      }
      .cart-item-row {
        grid-template-columns: 1fr;
        gap: 12px;
        align-items: flex-start;
      }
      .item-price-col, .item-qty-col, .item-total-col {
        text-align: left;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .mobile-label {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--warm-taupe);
        min-width: 65px;
      }
    }
  `]
})
export class CartComponent implements OnInit {
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.cartService.loadCart().subscribe();
    }
  }

  onUpdateQty(item: CartItem, newQty: number): void {
    if (newQty < 1) return;
    this.cartService.updateQuantity(item.productId, newQty).subscribe();
  }

  onRemoveItem(productId: number): void {
    this.cartService.removeItem(productId).subscribe();
  }

  onClearCart(): void {
    if (confirm('Are you sure you want to clear your shopping bag?')) {
      this.cartService.clearCart().subscribe();
    }
  }
}
