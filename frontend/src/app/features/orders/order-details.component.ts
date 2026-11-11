import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { OrderDetails } from '../../core/models/order.models';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="order-details-page">
      <div class="container details-container">
        
        <!-- Breadcrumb / Back Link -->
        <div class="back-nav fade-in">
          <a routerLink="/orders" class="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to All Orders
          </a>
        </div>

        @if (isLoading()) {
          <div class="skeleton-layout">
            <div class="skeleton-header skeleton"></div>
            <div class="skeleton-card skeleton"></div>
            <div class="skeleton-card skeleton"></div>
          </div>
        }

        @else if (errorMessage()) {
          <div class="empty-state fade-in">
            <div class="empty-icon">⚠️</div>
            <h3>Unable to Load Order</h3>
            <p>{{ errorMessage() }}</p>
            <a routerLink="/orders" class="btn btn-primary">Return to Orders</a>
          </div>
        }

        @else if (order(); as ord) {
          <div class="order-content fade-in">

            <!-- Top Header -->
            <header class="order-main-header">
              <div class="header-left">
                <span class="jp-sub">注文詳細 • ORDER DETAILS</span>
                <h1 class="order-title">Order #{{ ord.orderNumber }}</h1>
                <p class="order-date-text">
                  Placed on {{ ord.createdAtUtc | date:'fullDate' }} at {{ ord.createdAtUtc | date:'shortTime' }}
                </p>
              </div>
              <div class="header-right">
                <span class="badge badge-lg" [ngClass]="getStatusBadgeClass(ord.status)">
                  {{ ord.status }}
                </span>
              </div>
            </header>

            <!-- Status Tracker Timeline -->
            <section class="status-tracker-card">
              <h2 class="card-section-title">Fulfillment Progress</h2>
              <div class="timeline-steps">
                @for (step of fulfillmentSteps; track step.key; let idx = $index) {
                  <div class="timeline-step" [class.completed]="isStepCompleted(ord.status, step.key)" [class.current]="isCurrentStep(ord.status, step.key)">
                    <div class="step-circle">
                      @if (isStepCompleted(ord.status, step.key)) {
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      } @else {
                        <span>{{ idx + 1 }}</span>
                      }
                    </div>
                    <div class="step-label">{{ step.label }}</div>
                  </div>
                  @if (idx < fulfillmentSteps.length - 1) {
                    <div class="timeline-connector" [class.filled]="isStepCompleted(ord.status, fulfillmentSteps[idx+1].key)"></div>
                  }
                }
              </div>
              @if (ord.status === 'Cancelled') {
                <div class="cancelled-notice">
                  <span>This order has been cancelled.</span>
                </div>
              }
            </section>

            <!-- Two-Column Grid: Items & Shipping -->
            <div class="details-grid">
              
              <!-- Items Section -->
              <section class="items-card">
                <h2 class="card-section-title">Purchased Items ({{ ord.totalItems }})</h2>
                
                <div class="items-list">
                  @for (item of ord.items; track item.id) {
                    <div class="order-item-row">
                      <div class="item-img-wrap">
                        <img [src]="item.productImageUrl" [alt]="item.productName" (error)="onImgError($event)" />
                      </div>
                      
                      <div class="item-details">
                        <h3 class="item-name">{{ item.productName }}</h3>
                        <div class="item-meta">
                          <span class="unit-price">{{ item.unitPrice | number:'1.2-2' }} EGP</span>
                          <span class="qty-multiplier">× {{ item.quantity }}</span>
                        </div>
                      </div>

                      <div class="item-line-total">
                        {{ item.lineTotal | number:'1.2-2' }} EGP
                      </div>
                    </div>
                  }
                </div>

                <div class="order-totals">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>{{ ord.totalAmount | number:'1.2-2' }} EGP</span>
                  </div>
                  <div class="total-row">
                    <span>Shipping:</span>
                    <span class="free-badge">Complimentary</span>
                  </div>
                  <div class="total-row grand-total">
                    <span>Total Amount:</span>
                    <span class="amount">{{ ord.totalAmount | number:'1.2-2' }} EGP</span>
                  </div>
                </div>
              </section>

              <!-- Shipping Info Section -->
              <section class="shipping-card">
                <h2 class="card-section-title">Delivery Information</h2>

                <div class="shipping-info-block">
                  <div class="info-item">
                    <span class="info-label">Recipient Name</span>
                    <strong class="info-val">{{ ord.shippingFullName }}</strong>
                  </div>

                  <div class="info-item">
                    <span class="info-label">Contact Phone</span>
                    <span class="info-val">{{ ord.shippingPhone }}</span>
                  </div>

                  <div class="info-item">
                    <span class="info-label">Delivery Address</span>
                    <span class="info-val">{{ ord.shippingAddress }}</span>
                  </div>

                  <div class="info-item">
                    <span class="info-label">City / Region</span>
                    <span class="info-val">{{ ord.shippingCity }}</span>
                  </div>
                </div>

                <div class="packaging-assurance">
                  <div class="assurance-icon">📦</div>
                  <div class="assurance-text">
                    <strong>Collector-Grade Packaging</strong>
                    <p>All items are carefully insulated with reinforced bubble wraps to preserve mint-condition packaging.</p>
                  </div>
                </div>
              </section>

            </div>

          </div>
        }

      </div>
    </main>
  `,
  styles: [`
    .order-details-page {
      padding: 2.5rem 0 5rem;
      min-height: 70vh;
      background-color: var(--color-porcelain);
    }

    .details-container {
      max-width: 950px;
    }

    .back-nav {
      margin-bottom: 1.5rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-warm-taupe);
      transition: color var(--transition-fast);
    }

    .back-link:hover {
      color: var(--color-vermilion);
    }

    .skeleton-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .skeleton-header {
      height: 90px;
      border-radius: var(--radius-md);
    }

    .skeleton-card {
      height: 220px;
      border-radius: var(--radius-md);
    }

    .order-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .order-main-header {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .jp-sub {
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--color-deep-cherry);
      display: block;
      margin-bottom: 0.25rem;
    }

    .order-title {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--color-cocoa);
      margin-bottom: 0.25rem;
    }

    .order-date-text {
      font-size: 0.875rem;
      color: var(--color-warm-taupe);
    }

    .badge-lg {
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
    }

    .status-tracker-card {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      padding: 2rem;
    }

    .card-section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-cocoa);
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-rose-mist);
    }

    .timeline-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      z-index: 2;
    }

    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-porcelain);
      border: 2px solid var(--color-rose-mist);
      color: var(--color-warm-taupe);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      transition: all var(--transition-fast);
    }

    .timeline-step.completed .step-circle {
      background: var(--color-matcha);
      border-color: var(--color-matcha);
      color: var(--color-white);
    }

    .timeline-step.current .step-circle {
      background: var(--color-vermilion);
      border-color: var(--color-vermilion);
      color: var(--color-white);
      box-shadow: 0 0 0 4px var(--color-sakura);
    }

    .step-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-warm-taupe);
    }

    .timeline-step.completed .step-label,
    .timeline-step.current .step-label {
      color: var(--color-cocoa);
      font-weight: 700;
    }

    .timeline-connector {
      flex: 1;
      height: 3px;
      background: var(--color-rose-mist);
      margin: 0 0.5rem;
      transform: translateY(-12px);
    }

    .timeline-connector.filled {
      background: var(--color-matcha);
    }

    .cancelled-notice {
      margin-top: 1.5rem;
      padding: 0.875rem 1rem;
      background: var(--color-sakura);
      border: 1px solid var(--color-soft-peach);
      border-radius: var(--radius-sm);
      color: var(--color-deep-cherry);
      font-weight: 600;
      font-size: 0.9375rem;
      text-align: center;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    .items-card, .shipping-card {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      padding: 1.75rem;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .order-item-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px dashed var(--color-rose-mist);
    }

    .order-item-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .item-img-wrap {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-sm);
      background: var(--color-porcelain);
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid var(--color-rose-mist);
    }

    .item-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-details {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-cocoa);
      margin-bottom: 0.25rem;
      line-height: 1.3;
    }

    .item-meta {
      display: flex;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--color-warm-taupe);
    }

    .item-line-total {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--color-cocoa);
      white-space: nowrap;
    }

    .order-totals {
      border-top: 1px solid var(--color-rose-mist);
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9375rem;
      color: var(--color-warm-taupe);
    }

    .free-badge {
      color: var(--color-matcha);
      font-weight: 700;
    }

    .grand-total {
      border-top: 1px dashed var(--color-rose-mist);
      padding-top: 0.75rem;
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--color-cocoa);
    }

    .grand-total .amount {
      color: var(--color-vermilion);
    }

    .shipping-info-block {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .info-item {
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
      color: var(--color-cocoa);
    }

    .packaging-assurance {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--color-porcelain);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-rose-mist);
    }

    .assurance-icon {
      font-size: 1.5rem;
    }

    .assurance-text strong {
      display: block;
      font-size: 0.8125rem;
      color: var(--color-cocoa);
      margin-bottom: 0.25rem;
    }

    .assurance-text p {
      font-size: 0.75rem;
      color: var(--color-warm-taupe);
      line-height: 1.4;
      margin: 0;
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

    @media (max-width: 768px) {
      .details-grid {
        grid-template-columns: 1fr;
      }

      .order-main-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .timeline-steps {
        flex-wrap: wrap;
        gap: 1rem;
      }

      .timeline-connector {
        display: none;
      }
    }
  `]
})
export class OrderDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  readonly order = signal<OrderDetails | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly fulfillmentSteps = [
    { key: 'Pending', label: 'Pending' },
    { key: 'Confirmed', label: 'Confirmed' },
    { key: 'Processing', label: 'Processing' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Delivered', label: 'Delivered' }
  ];

  private readonly stepOrder: { [key: string]: number } = {
    'Pending': 1,
    'Confirmed': 2,
    'Processing': 3,
    'Shipped': 4,
    'Delivered': 5,
    'Cancelled': 0
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadOrder(Number(idParam));
    } else {
      this.errorMessage.set('Invalid order ID provided.');
      this.isLoading.set(false);
    }
  }

  loadOrder(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getOrderById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Could not retrieve order details.');
        this.isLoading.set(false);
      }
    });
  }

  isStepCompleted(currentStatus: string, stepKey: string): boolean {
    if (currentStatus === 'Cancelled') return false;
    const currentLevel = this.stepOrder[currentStatus] || 0;
    const stepLevel = this.stepOrder[stepKey] || 0;
    return currentLevel > stepLevel;
  }

  isCurrentStep(currentStatus: string, stepKey: string): boolean {
    return currentStatus.toLowerCase() === stepKey.toLowerCase();
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

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'http://localhost:5232/uploads/luffy_gear5.jpg';
  }
}
