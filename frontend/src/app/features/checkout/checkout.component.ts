import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { CreateOrderRequest, OrderDetails } from '../../core/models/order.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="checkout-page">
      <div class="container checkout-container">
        
        <header class="checkout-header">
          <span class="jp-tag">チェックアウト • ORDER CHECKOUT</span>
          <h1 class="page-title">Shipping & Order Review</h1>
          <p class="page-subtitle">Confirm your destination details and review items before placing your order.</p>
        </header>

        @if (cartService.cart() && cartService.cart()!.items.length === 0) {
          <div class="empty-notice-card">
            <h3>Your Cart is Empty</h3>
            <p>You need items in your bag before proceeding to checkout.</p>
            <a routerLink="/shop" class="btn btn-primary">Browse Collectibles</a>
          </div>
        } @else if (cartService.cart()) {
          <div class="checkout-grid">
            
            <!-- Left: Shipping Address Form -->
            <div class="shipping-card">
              <div class="card-header">
                <span class="step-num">1</span>
                <h3>Shipping Information</h3>
              </div>

              @if (errorMessage()) {
                <div class="alert-error" role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <form (ngSubmit)="onPlaceOrder()" #checkoutForm="ngForm">
                
                <!-- Recipient Full Name -->
                <div class="form-group">
                  <label class="form-label" for="shipName">Recipient Full Name *</label>
                  <input 
                    id="shipName"
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="shippingFullName" 
                    name="shippingFullName" 
                    required 
                    minlength="2"
                    placeholder="e.g. Kenji Sato"
                    #nameInput="ngModel"
                  />
                  @if (nameInput.invalid && (nameInput.dirty || nameInput.touched)) {
                    <span class="form-error">Please enter recipient name.</span>
                  }
                </div>

                <!-- Phone Number -->
                <div class="form-group">
                  <label class="form-label" for="shipPhone">Phone Number *</label>
                  <input 
                    id="shipPhone"
                    type="tel" 
                    class="form-control" 
                    [(ngModel)]="shippingPhone" 
                    name="shippingPhone" 
                    required 
                    minlength="6"
                    placeholder="e.g. +201012345678"
                    #phoneInput="ngModel"
                  />
                  @if (phoneInput.invalid && (phoneInput.dirty || phoneInput.touched)) {
                    <span class="form-error">Please provide a valid contact phone number.</span>
                  }
                </div>

                <!-- Delivery Address -->
                <div class="form-group">
                  <label class="form-label" for="shipAddress">Delivery Address *</label>
                  <input 
                    id="shipAddress"
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="shippingAddress" 
                    name="shippingAddress" 
                    required 
                    minlength="5"
                    placeholder="Street, building number, apartment"
                    #addrInput="ngModel"
                  />
                  @if (addrInput.invalid && (addrInput.dirty || addrInput.touched)) {
                    <span class="form-error">Please provide a complete street address.</span>
                  }
                </div>

                <!-- City -->
                <div class="form-group">
                  <label class="form-label" for="shipCity">City / Destination *</label>
                  <input 
                    id="shipCity"
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="shippingCity" 
                    name="shippingCity" 
                    required 
                    minlength="2"
                    placeholder="e.g. Cairo, Giza, Alexandria"
                    #cityInput="ngModel"
                  />
                  @if (cityInput.invalid && (cityInput.dirty || cityInput.touched)) {
                    <span class="form-error">City is required.</span>
                  }
                </div>

                <!-- Payment Notice (Transparent, No fake card form) -->
                <div class="payment-policy-box">
                  <div class="policy-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                      <line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    <h4>Payment & Settlement</h4>
                  </div>
                  <p>
                    Orders placed on KITSU MARKET are reserved immediately in warehouse inventory upon submission. 
                    Settlement is processed in Egyptian Pounds (EGP) upon final courier confirmation. No credit card is required right now.
                  </p>
                </div>

                <!-- Action Button -->
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg place-order-btn" 
                  [disabled]="checkoutForm.invalid || isSubmitting()"
                >
                  @if (isSubmitting()) {
                    <span class="btn-spinner"></span>
                    <span>Reserving Stock & Placing Order...</span>
                  } @else {
                    <span>Confirm & Place Order • {{ cartService.totalAmount() | number:'1.2-2' }} EGP</span>
                  }
                </button>

              </form>
            </div>

            <!-- Right: Order Review Recap -->
            <div class="review-card">
              <div class="card-header">
                <span class="step-num">2</span>
                <h3>Order Review</h3>
              </div>

              <div class="recap-items">
                @for (item of cartService.cart()!.items; track item.productId) {
                  <div class="recap-item">
                    <img [src]="item.productImageUrl" [alt]="item.productName" class="recap-thumb" />
                    <div class="recap-details">
                      <h4 class="recap-name">{{ item.productName }}</h4>
                      <div class="recap-meta">
                        <span>Qty: {{ item.quantity }}</span>
                        <span>•</span>
                        <span class="recap-price">{{ item.lineTotal | number:'1.2-2' }} EGP</span>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="recap-divider"></div>

              <div class="recap-totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>{{ cartService.totalAmount() | number:'1.2-2' }} EGP</span>
                </div>
                <div class="total-row">
                  <span>Shipping:</span>
                  <span class="free-text">Standard Courier</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total Amount:</span>
                  <span class="grand-amount">{{ cartService.totalAmount() | number:'1.2-2' }} EGP</span>
                </div>
              </div>

              <div class="security-guarantee">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Atomic Transaction: Inventory reserved instantly upon placement</span>
              </div>
            </div>

          </div>
        }

      </div>
    </main>
  `,
  styles: [`
    .checkout-page {
      padding: 40px 0 80px;
    }
    .checkout-container {
      max-width: 1080px;
    }
    .checkout-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--rose-mist);
    }
    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
      margin: 4px 0;
    }
    .page-subtitle {
      font-size: 0.9375rem;
      color: var(--warm-taupe);
    }

    .checkout-grid {
      display: grid;
      grid-template-columns: 1.25fr 0.85fr;
      gap: 36px;
      align-items: start;
    }
    .shipping-card, .review-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      padding: 32px;
      box-shadow: var(--shadow-sm);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--porcelain);
    }
    .step-num {
      width: 28px;
      height: 28px;
      background-color: var(--vermilion);
      color: var(--pure-white);
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-header h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
    }

    .payment-policy-box {
      background-color: var(--porcelain);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-sm);
      padding: 16px;
      margin: 24px 0;
    }
    .policy-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--cocoa-brown);
      margin-bottom: 8px;
    }
    .policy-header h4 {
      font-size: 0.875rem;
      font-weight: 700;
    }
    .payment-policy-box p {
      font-size: 0.8125rem;
      color: var(--warm-taupe);
      line-height: 1.5;
    }
    .place-order-btn {
      width: 100%;
    }

    /* Review Card */
    .recap-items {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
      max-height: 340px;
      overflow-y: auto;
    }
    .recap-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .recap-thumb {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      background-color: var(--porcelain);
      border: 1px solid var(--rose-mist);
      flex-shrink: 0;
    }
    .recap-details {
      flex: 1;
    }
    .recap-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--cocoa-brown);
      margin-bottom: 2px;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .recap-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--warm-taupe);
      font-weight: 600;
    }
    .recap-price {
      color: var(--vermilion);
      font-weight: 700;
    }
    .recap-divider {
      height: 1px;
      background-color: var(--rose-mist);
      margin: 16px 0;
    }
    .recap-totals {
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.875rem;
      margin-bottom: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      color: var(--warm-taupe);
    }
    .free-text {
      color: var(--matcha-olive);
      font-weight: 700;
    }
    .grand-total {
      padding-top: 10px;
      border-top: 1px dashed var(--rose-mist);
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--cocoa-brown);
    }
    .grand-amount {
      color: var(--vermilion);
      font-size: 1.35rem;
    }
    .security-guarantee {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--warm-taupe);
      padding: 10px;
      background-color: var(--porcelain);
      border-radius: var(--radius-sm);
    }
    .alert-error {
      background-color: var(--sakura-blush);
      border-left: 4px solid var(--vermilion);
      color: var(--deep-cherry);
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      margin-bottom: 20px;
      font-size: 0.84375rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .empty-notice-card {
      text-align: center;
      padding: 60px 24px;
      background: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
    }

    @media (max-width: 868px) {
      .checkout-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  shippingFullName = '';
  shippingPhone = '';
  shippingAddress = '';
  shippingCity = 'Cairo';

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.shippingFullName = user.fullName;
    }
    this.cartService.loadCart().subscribe();
  }

  onPlaceOrder(): void {
    if (!this.shippingFullName || !this.shippingPhone || !this.shippingAddress || !this.shippingCity) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const request: CreateOrderRequest = {
      shippingFullName: this.shippingFullName.trim(),
      shippingPhone: this.shippingPhone.trim(),
      shippingAddress: this.shippingAddress.trim(),
      shippingCity: this.shippingCity.trim()
    };

    this.orderService.checkout(request).subscribe({
      next: (order: OrderDetails) => {
        this.isSubmitting.set(false);
        // Refresh cart in service
        this.cartService.loadCart().subscribe();
        // Navigate to confirmation screen
        this.router.navigate(['/orders/confirmation', order.id]);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to place order. A product might be out of stock.');
      }
    });
  }
}
