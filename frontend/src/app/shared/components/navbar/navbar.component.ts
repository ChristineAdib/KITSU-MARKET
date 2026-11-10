import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="navbar-wrapper" [class.is-scrolled]="isScrolled()">
      <div class="container navbar-container">
        
        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" type="button" aria-label="Toggle Navigation" (click)="toggleMobileMenu()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            @if (isMobileMenuOpen()) {
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            } @else {
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            }
          </svg>
        </button>

        <!-- Brand Logo -->
        <a routerLink="/" class="brand-logo" (click)="closeMobileMenu()">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
              <polygon points="32,4 12,24 20,44 32,58 44,44 52,24" fill="#D94D3F"/>
              <polygon points="32,16 20,28 26,42 32,50 38,42 44,28" fill="#FFF8F4"/>
              <polygon points="32,24 26,34 38,34" fill="#5B443B"/>
              <circle cx="27" cy="30" r="2" fill="#D94D3F"/>
              <circle cx="37" cy="30" r="2" fill="#D94D3F"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="main-title">KITSU MARKET</span>
            <span class="sub-title">狐市 • TOKYO EDITORIAL</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/shop" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Shop</a>
          <a routerLink="/shop" [queryParams]="{ isFeatured: true }" routerLinkActive="active">Featured</a>
          <a routerLink="/shop" [queryParams]="{ sortBy: 'newest' }" routerLinkActive="active">New Arrivals</a>
          @if (authService.isAdmin()) {
            <a routerLink="/admin" class="admin-nav-link" routerLinkActive="active">
              <span class="admin-badge">Admin</span>
            </a>
          }
        </nav>

        <!-- Search Bar (Inline Desktop) -->
        <div class="nav-search-box">
          <form (ngSubmit)="onSearchSubmit()">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search collectibles..." 
              [(ngModel)]="searchKeyword" 
              name="search"
              autocomplete="off"
            />
          </form>
        </div>

        <!-- Right Actions: Account & Cart -->
        <div class="nav-actions">
          
          <!-- Account Dropdown Trigger -->
          <div class="account-dropdown-wrapper">
            @if (authService.isAuthenticated()) {
              <button 
                class="icon-btn account-btn" 
                type="button" 
                (click)="toggleAccountMenu()" 
                [attr.aria-expanded]="isAccountMenuOpen()"
                title="Account Menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span class="user-first-name">{{ getUserShortName() }}</span>
              </button>

              @if (isAccountMenuOpen()) {
                <div class="dropdown-card" (mouseleave)="closeAccountMenu()">
                  <div class="dropdown-header">
                    <p class="user-name">{{ authService.currentUser()?.fullName }}</p>
                    <p class="user-email">{{ authService.currentUser()?.email }}</p>
                  </div>
                  <div class="dropdown-divider"></div>
                  <a routerLink="/account" (click)="closeAccountMenu()">My Account</a>
                  <a routerLink="/orders" (click)="closeAccountMenu()">My Orders</a>
                  @if (authService.isAdmin()) {
                    <a routerLink="/admin" class="admin-dropdown-link" (click)="closeAccountMenu()">Admin Dashboard</a>
                  }
                  <div class="dropdown-divider"></div>
                  <button type="button" class="logout-btn" (click)="onLogout()">
                    Sign Out
                  </button>
                </div>
              }
            } @else {
              <a routerLink="/login" class="login-link">Sign In</a>
            }
          </div>

          <!-- Cart Action with Live Badge -->
          <a routerLink="/cart" class="icon-btn cart-btn" title="View Shopping Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            @if (cartService.itemCount() > 0) {
              <span class="cart-badge">{{ cartService.itemCount() }}</span>
            }
          </a>

        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      @if (isMobileMenuOpen()) {
        <div class="mobile-drawer fade-in">
          <div class="mobile-search-form">
            <form (ngSubmit)="onSearchSubmit()">
              <input 
                type="text" 
                placeholder="Search products, apparel..." 
                [(ngModel)]="searchKeyword" 
                name="mobileSearch"
              />
              <button type="submit" class="btn btn-primary btn-sm">Search</button>
            </form>
          </div>

          <nav class="mobile-links">
            <a routerLink="/" (click)="closeMobileMenu()">Home</a>
            <a routerLink="/shop" (click)="closeMobileMenu()">Shop All</a>
            <a routerLink="/shop" [queryParams]="{ isFeatured: true }" (click)="closeMobileMenu()">Featured Items</a>
            <a routerLink="/shop" [queryParams]="{ sortBy: 'newest' }" (click)="closeMobileMenu()">New Arrivals</a>
            
            <div class="mobile-divider"></div>

            @if (authService.isAuthenticated()) {
              <a routerLink="/account" (click)="closeMobileMenu()">My Profile ({{ authService.currentUser()?.fullName }})</a>
              <a routerLink="/orders" (click)="closeMobileMenu()">My Orders</a>
              @if (authService.isAdmin()) {
                <a routerLink="/admin" class="admin-mobile-link" (click)="closeMobileMenu()">Admin Dashboard</a>
              }
              <button type="button" class="mobile-logout-btn" (click)="onLogout()">Sign Out</button>
            } @else {
              <a routerLink="/login" class="mobile-auth-btn" (click)="closeMobileMenu()">Sign In</a>
              <a routerLink="/register" class="mobile-auth-btn-sec" (click)="closeMobileMenu()">Create Account</a>
            }
          </nav>
        </div>
      }
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 900;
      background-color: var(--pure-white);
      border-bottom: 1px solid var(--rose-mist);
      transition: box-shadow var(--transition-fast), background-color var(--transition-fast);
    }
    .navbar-wrapper.is-scrolled {
      box-shadow: 0 4px 18px rgba(91, 68, 59, 0.06);
    }
    .navbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
      gap: 20px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    .main-title {
      font-size: 1.1875rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--cocoa-brown);
      line-height: 1.1;
    }
    .sub-title {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 0.5625rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--warm-taupe);
      line-height: 1.2;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 26px;
    }
    .nav-links a {
      font-size: 0.90625rem;
      font-weight: 600;
      color: var(--cocoa-brown);
      position: relative;
      padding: 6px 0;
    }
    .nav-links a:hover, .nav-links a.active {
      color: var(--vermilion);
    }
    .nav-links a.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--vermilion);
      border-radius: var(--radius-full);
    }
    .admin-badge {
      background-color: var(--vermilion);
      color: var(--pure-white);
      padding: 3px 8px;
      border-radius: var(--radius-full);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .nav-search-box {
      flex: 1;
      max-width: 260px;
      position: relative;
    }
    .nav-search-box form {
      position: relative;
    }
    .nav-search-box input {
      width: 100%;
      padding: 8px 14px 8px 34px;
      font-size: 0.8125rem;
      background-color: var(--porcelain);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-full);
      color: var(--cocoa-brown);
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
    }
    .nav-search-box input:focus {
      outline: none;
      border-color: var(--vermilion);
      background-color: var(--pure-white);
    }
    .search-icon {
      position: absolute;
      left: 11px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--warm-taupe);
      pointer-events: none;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      color: var(--cocoa-brown);
      border-radius: var(--radius-sm);
      position: relative;
      transition: color var(--transition-fast), background-color var(--transition-fast);
    }
    .icon-btn:hover {
      color: var(--vermilion);
      background-color: var(--porcelain);
    }
    .cart-btn {
      position: relative;
    }
    .cart-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background-color: var(--vermilion);
      color: var(--pure-white);
      font-size: 0.6875rem;
      font-weight: 800;
      height: 18px;
      min-width: 18px;
      padding: 0 4px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(217, 77, 63, 0.4);
      animation: badgePop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .account-dropdown-wrapper {
      position: relative;
    }
    .user-first-name {
      font-size: 0.84375rem;
      font-weight: 600;
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .login-link {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--vermilion);
      padding: 6px 12px;
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-sm);
    }
    .login-link:hover {
      background-color: var(--sakura-blush);
    }
    .dropdown-card {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      width: 220px;
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 10px 0;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    .dropdown-header {
      padding: 8px 16px;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--cocoa-brown);
    }
    .user-email {
      font-size: 0.75rem;
      color: var(--warm-taupe);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dropdown-divider {
      height: 1px;
      background-color: var(--rose-mist);
      margin: 6px 0;
    }
    .dropdown-card a {
      display: block;
      padding: 8px 16px;
      font-size: 0.84375rem;
      font-weight: 500;
      color: var(--cocoa-brown);
    }
    .dropdown-card a:hover {
      background-color: var(--porcelain);
      color: var(--vermilion);
    }
    .admin-dropdown-link {
      color: var(--vermilion) !important;
      font-weight: 700 !important;
    }
    .logout-btn {
      width: 100%;
      text-align: left;
      padding: 8px 16px;
      font-size: 0.84375rem;
      font-weight: 600;
      color: var(--deep-cherry);
      transition: background-color var(--transition-fast);
    }
    .logout-btn:hover {
      background-color: var(--sakura-blush);
    }
    .mobile-toggle {
      display: none;
      padding: 6px;
      color: var(--cocoa-brown);
    }
    .mobile-drawer {
      display: none;
    }
    @keyframes badgePop {
      0% { transform: scale(0.6); }
      70% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    @media (max-width: 868px) {
      .nav-links, .nav-search-box {
        display: none;
      }
      .mobile-toggle {
        display: block;
      }
      .mobile-drawer {
        display: block;
        background-color: var(--pure-white);
        border-top: 1px solid var(--rose-mist);
        padding: 16px;
        box-shadow: var(--shadow-md);
      }
      .mobile-search-form form {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }
      .mobile-search-form input {
        flex: 1;
        padding: 10px 14px;
        font-size: 0.875rem;
        border: 1px solid var(--rose-mist);
        border-radius: var(--radius-sm);
        background: var(--porcelain);
      }
      .mobile-links {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .mobile-links a {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--cocoa-brown);
        padding: 6px 0;
      }
      .mobile-divider {
        height: 1px;
        background-color: var(--rose-mist);
        margin: 8px 0;
      }
      .mobile-logout-btn {
        text-align: left;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--deep-cherry);
        padding: 6px 0;
      }
      .admin-mobile-link {
        color: var(--vermilion) !important;
        font-weight: 700 !important;
      }
    }
  `]
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly isScrolled = signal<boolean>(false);
  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly isAccountMenuOpen = signal<boolean>(false);
  searchKeyword = '';

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 20);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleAccountMenu(): void {
    this.isAccountMenuOpen.update(v => !v);
  }

  closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

  getUserShortName(): string {
    const fullName = this.authService.currentUser()?.fullName || 'Account';
    return fullName.split(' ')[0];
  }

  onSearchSubmit(): void {
    if (this.searchKeyword.trim()) {
      this.router.navigate(['/shop'], {
        queryParams: { search: this.searchKeyword.trim() }
      });
      this.searchKeyword = '';
      this.closeMobileMenu();
    }
  }

  onLogout(): void {
    this.closeAccountMenu();
    this.closeMobileMenu();
    this.authService.logout();
  }
}
