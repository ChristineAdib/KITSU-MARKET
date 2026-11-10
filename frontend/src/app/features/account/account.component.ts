import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="account-page">
      <div class="container account-container">
        
        <header class="account-header">
          <span class="jp-tag">マイアカウント • CUSTOMER PROFILE</span>
          <h1 class="page-title">My Account</h1>
        </header>

        <div class="account-grid">
          
          <!-- User Profile Card -->
          <div class="profile-card">
            <div class="avatar-circle">
              {{ getInitials() }}
            </div>
            <h2 class="user-name">{{ authService.currentUser()?.fullName }}</h2>
            <p class="user-email">{{ authService.currentUser()?.email }}</p>
            
            <div class="roles-tags">
              @for (role of authService.currentUser()?.roles; track role) {
                <span class="badge" [class.badge-vermilion]="role === 'Admin'" [class.badge-featured]="role === 'Customer'">
                  {{ role }}
                </span>
              }
            </div>

            <div class="card-divider"></div>

            <div class="profile-actions">
              <a routerLink="/orders" class="btn btn-primary btn-sm">
                View My Orders
              </a>
              @if (authService.isAdmin()) {
                <a routerLink="/admin" class="btn btn-secondary btn-sm admin-btn">
                  Open Admin Portal
                </a>
              }
              <button type="button" class="btn btn-secondary btn-sm sign-out-btn" (click)="authService.logout()">
                Sign Out
              </button>
            </div>
          </div>

          <!-- Quick Navigation / Stats -->
          <div class="quick-links-card">
            <h3>Customer Hub</h3>
            <div class="hub-list">
              <a routerLink="/orders" class="hub-item">
                <div class="hub-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                  </svg>
                </div>
                <div class="hub-text">
                  <h4>Order History</h4>
                  <p>Track shipment and review past purchases</p>
                </div>
                <span class="hub-arrow">&rarr;</span>
              </a>

              <a routerLink="/cart" class="hub-item">
                <div class="hub-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <div class="hub-text">
                  <h4>Shopping Bag</h4>
                  <p>Review items saved for purchase</p>
                </div>
                <span class="hub-arrow">&rarr;</span>
              </a>

              <a routerLink="/shop" class="hub-item">
                <div class="hub-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div class="hub-text">
                  <h4>Browse Catalog</h4>
                  <p>Explore newly arrived anime figures & apparel</p>
                </div>
                <span class="hub-arrow">&rarr;</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </main>
  `,
  styles: [`
    .account-page {
      padding: 40px 0 80px;
    }
    .account-container {
      max-width: 900px;
    }
    .account-header {
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

    .account-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 32px;
      align-items: start;
    }
    .profile-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      padding: 36px 24px;
      text-align: center;
      box-shadow: var(--shadow-sm);
    }
    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: var(--sakura-blush);
      color: var(--vermilion);
      font-size: 1.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      border: 2px solid var(--soft-peach);
    }
    .user-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin-bottom: 4px;
    }
    .user-email {
      font-size: 0.84375rem;
      color: var(--warm-taupe);
      margin-bottom: 16px;
    }
    .roles-tags {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .card-divider {
      height: 1px;
      background-color: var(--porcelain);
      margin: 20px 0;
    }
    .profile-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .admin-btn {
      color: var(--vermilion);
      font-weight: 700;
    }
    .sign-out-btn {
      color: var(--deep-cherry);
    }

    /* Quick Links */
    .quick-links-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      padding: 32px;
      box-shadow: var(--shadow-sm);
    }
    .quick-links-card h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--porcelain);
    }
    .hub-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .hub-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--porcelain);
      background-color: var(--porcelain);
      transition: background-color var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
    }
    .hub-item:hover {
      background-color: var(--pure-white);
      border-color: var(--soft-peach);
      transform: translateX(4px);
    }
    .hub-icon {
      color: var(--vermilion);
      flex-shrink: 0;
    }
    .hub-text {
      flex: 1;
    }
    .hub-text h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--cocoa-brown);
      margin-bottom: 2px;
    }
    .hub-text p {
      font-size: 0.8125rem;
      color: var(--warm-taupe);
    }
    .hub-arrow {
      color: var(--warm-taupe);
      font-size: 1.125rem;
    }

    @media (max-width: 768px) {
      .account-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AccountComponent {
  readonly authService = inject(AuthService);

  getInitials(): string {
    const name = this.authService.currentUser()?.fullName || 'User';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
