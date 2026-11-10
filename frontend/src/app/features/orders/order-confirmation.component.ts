import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { OrderDetails } from '../../core/models/order.models';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="confirmation-page">
      <div class="container confirmation-container">
        
        <div class="confirmation-card fade-in">
          
          <div class="success-icon-badge">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>

          <span class="jp-tag">注文完了 • ORDER CONFIRMED</span>
          <h1 class="confirm-title">Thank You For Your Order!</h1>
          <p class="confirm-subtitle">
            Your anime collectible order has been confirmed and reserved in warehouse stock.
          </p>

          @if (order()) {
            <div class="order-id-box">
              <span class="id-label">Official Order Identifier:</span>
              <span class="order-number">{{ order()!.orderNumber }}</span>
              <span class="status-pill">{{ order()!.status }}</span>
            </div>

            <div class="order-summary-box">
              <div class="summary-line">
                <span>Total Amount:</span>
                <strong class="total-val">{{ order()!.totalAmount | number:'1.2-2' }} EGP</strong>
              </div>
              <div class="summary-line">
                <span>Items Ordered:</span>
                <span>{{ order()!.totalItems }} items</span>
              </div>
              <div class="summary-line">
                <span>Shipping Recipient:</span>
                <span>{{ order()!.shippingFullName }} ({{ order()!.shippingCity }})</span>
              </div>
            </div>

            <div class="action-buttons">
              <a [routerLink]="['/orders', order()!.id]" class="btn btn-primary btn-lg">
                View Order Details & Status
              </a>
              <a routerLink="/shop" class="btn btn-secondary btn-lg">
                Continue Shopping
              </a>
            </div>
          } @else if (isLoading()) {
            <div class="skeleton" style="height: 120px; width: 80%; margin: 24px auto;"></div>
          }

        </div>

      </div>
    </main>
  `,
  styles: [`
    .confirmation-page {
      padding: 60px 0 100px;
    }
    .confirmation-container {
      max-width: 680px;
    }
    .confirmation-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-lg);
      padding: 56px 40px;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }
    .success-icon-badge {
      width: 72px;
      height: 72px;
      background-color: var(--sakura-blush);
      color: var(--vermilion);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .confirm-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
      margin: 8px 0 12px;
    }
    .confirm-subtitle {
      font-size: 0.9375rem;
      color: var(--warm-taupe);
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .order-id-box {
      background-color: var(--porcelain);
      border: 1.5px dashed var(--soft-peach);
      border-radius: var(--radius-md);
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .id-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--warm-taupe);
    }
    .order-number {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--vermilion);
    }
    .status-pill {
      background-color: var(--matcha-olive);
      color: var(--pure-white);
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
    }
    .order-summary-box {
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-sm);
      padding: 16px 20px;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--warm-taupe);
    }
    .total-val {
      color: var(--cocoa-brown);
      font-size: 1rem;
    }
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .confirmation-card {
        padding: 36px 20px;
      }
      .confirm-title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class OrderConfirmationComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<OrderDetails | null>(null);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.orderService.getOrderById(id).subscribe({
        next: o => {
          this.order.set(o);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.isLoading.set(false);
    }
  }
}
