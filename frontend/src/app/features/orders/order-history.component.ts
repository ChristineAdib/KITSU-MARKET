import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { OrderSummary } from '../../core/models/order.models';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="orders-page">
      <div class="container orders-container">
        
        <!-- Header -->
        <header class="page-header fade-in">
          <div class="header-pre">
            <span class="jp-sub">注文履歴 • MY ORDERS</span>
          </div>
          <h1 class="page-title">Order History</h1>
          <p class="page-description">
            Track and review all your past and active KITSU MARKET collectible orders.
          </p>
        </header>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="orders-list">
            @for (i of [1, 2, 3]; track i) {
              <div class="order-skeleton skeleton"></div>
            }
          </div>
        }

        <!-- Error State -->
        @else if (errorMessage()) {
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h3>Unable to Load Orders</h3>
            <p>{{ errorMessage() }}</p>
            <button class="btn btn-primary" (click)="loadOrders()">Retry</button>
          </div>
        }

        <!-- Empty State -->
        @else if (orders().length === 0) {
          <div class="empty-state fade-in">
            <div class="empty-icon">📦</div>
            <h3>No Orders Placed Yet</h3>
            <p>You haven't placed any orders yet. Discover rare figures, apparel, and manga treasures!</p>
            <a routerLink="/shop" class="btn btn-primary btn-lg">Explore Catalog</a>
          </div>
        }

        <!-- Orders List -->
        @else {
          <div class="orders-list fade-in">
            @for (order of orders(); track order.id) {
              <article class="order-card">
                <div class="order-header">
                  <div class="order-meta">
                    <span class="order-number">{{ order.orderNumber }}</span>
                    <span class="order-date">{{ order.createdAtUtc | date:'mediumDate' }}</span>
                  </div>
                  <span class="badge" [ngClass]="getStatusBadgeClass(order.status)">
                    {{ order.status }}
                  </span>
                </div>

                <div class="order-body">
                  <div class="info-group">
                    <span class="info-label">Items</span>
                    <span class="info-val">{{ order.totalItems }} {{ order.totalItems === 1 ? 'item' : 'items' }}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Destination</span>
                    <span class="info-val">{{ order.shippingCity }}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Total Amount</span>
                    <span class="info-val price">{{ order.totalAmount | number:'1.2-2' }} EGP</span>
                  </div>
                </div>

                <div class="order-footer">
                  <a [routerLink]="['/orders', order.id]" class="btn btn-secondary btn-sm">
                    View Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </a>
                </div>
              </article>
            }
          </div>
        }

      </div>
    </main>
  `,
  styles: [`
    .orders-page {
      padding: 3rem 0 5rem;
      min-height: 70vh;
      background-color: var(--color-porcelain);
    }

    .orders-container {
      max-width: 900px;
    }

    .page-header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--color-rose-mist);
      padding-bottom: 1.5rem;
    }

    .header-pre {
      margin-bottom: 0.5rem;
    }

    .jp-sub {
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--color-deep-cherry);
      text-transform: uppercase;
    }

    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--color-cocoa);
      margin-bottom: 0.5rem;
    }

    .page-description {
      color: var(--color-warm-taupe);
      font-size: 1rem;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .order-skeleton {
      height: 140px;
      border-radius: var(--radius-md);
    }

    .order-card {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .order-card:hover {
      box-shadow: var(--shadow-sm);
      border-color: var(--color-soft-peach);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px dashed var(--color-rose-mist);
      padding-bottom: 1rem;
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .order-number {
      font-family: monospace;
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--color-cocoa);
      letter-spacing: 0.04em;
    }

    .order-date {
      font-size: 0.8125rem;
      color: var(--color-warm-taupe);
    }

    .order-body {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .info-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-warm-taupe);
      font-weight: 600;
    }

    .info-val {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--color-cocoa);
    }

    .info-val.price {
      color: var(--color-vermilion);
      font-weight: 800;
    }

    .order-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--color-rose-mist);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      max-width: 500px;
      margin: 2rem auto;
    }

    .empty-icon {
      font-size: 3rem;
    }

    .empty-state h3 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-cocoa);
    }

    .empty-state p {
      color: var(--color-warm-taupe);
      font-size: 0.9375rem;
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      .order-body {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .order-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
    }
  `]
})
export class OrderHistoryComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  readonly orders = signal<OrderSummary[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Could not fetch your order history.');
        this.isLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'confirmed':
      case 'processing':
        return 'badge-primary';
      case 'shipped':
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  }
}
