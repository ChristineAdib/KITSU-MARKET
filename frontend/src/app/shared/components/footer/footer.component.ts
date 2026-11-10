import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer-wrapper">
      <div class="container footer-container">
        
        <!-- Brand Info -->
        <div class="footer-col brand-col">
          <div class="brand-logo">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <polygon points="32,4 12,24 20,44 32,58 44,44 52,24" fill="#D94D3F"/>
              <polygon points="32,16 20,28 26,42 32,50 38,42 44,28" fill="#FFF8F4"/>
              <polygon points="32,24 26,34 38,34" fill="#5B443B"/>
              <circle cx="27" cy="30" r="2" fill="#D94D3F"/>
              <circle cx="37" cy="30" r="2" fill="#D94D3F"/>
            </svg>
            <span class="logo-title">KITSU MARKET</span>
          </div>
          <p class="brand-desc">
            A modern Japanese-inspired destination for authentic anime collectibles, original apparel, manga prints, and shrine accessories.
          </p>
          <div class="jp-motto">
            <span>東京ポップ • エディトリアル</span>
            <span class="motto-sub">Curated with Passion</span>
          </div>
        </div>

        <!-- Shop Links -->
        <div class="footer-col">
          <h4 class="col-title">Shop Collection</h4>
          <ul class="footer-links">
            <li><a routerLink="/shop">All Collectibles</a></li>
            <li><a routerLink="/shop" [queryParams]="{ categoryId: 1 }">Figures & Statues</a></li>
            <li><a routerLink="/shop" [queryParams]="{ categoryId: 2 }">Anime Apparel</a></li>
            <li><a routerLink="/shop" [queryParams]="{ categoryId: 3 }">Accessories & Charms</a></li>
            <li><a routerLink="/shop" [queryParams]="{ categoryId: 5 }">Manga & Art Books</a></li>
          </ul>
        </div>

        <!-- Customer Links -->
        <div class="footer-col">
          <h4 class="col-title">Account & Orders</h4>
          <ul class="footer-links">
            <li><a routerLink="/account">My Account</a></li>
            <li><a routerLink="/orders">Order History</a></li>
            <li><a routerLink="/cart">Shopping Bag</a></li>
            @if (authService.isAdmin()) {
              <li><a routerLink="/admin" class="admin-link">Admin Portal</a></li>
            }
          </ul>
        </div>

        <!-- Brand Values -->
        <div class="footer-col">
          <h4 class="col-title">Customer Care</h4>
          <p class="footer-text">
            Prices displayed in Egyptian Pounds (EGP).
          </p>
          <div class="support-box">
            <span class="support-label">Customer Support:</span>
            <span class="support-email">support&#64;kitsumarket.com</span>
          </div>
        </div>

      </div>

      <!-- Copyright Bottom Bar -->
      <div class="copyright-bar">
        <div class="container copyright-content">
          <p>&copy; 2026 KITSU MARKET. All rights reserved.</p>
          <p class="tokyo-tag">TOKYO POP EDITORIAL • EST. 2026</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-wrapper {
      background-color: var(--cocoa-brown);
      color: var(--sakura-blush);
      border-top: 2px solid var(--vermilion);
      margin-top: 80px;
    }
    .footer-container {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.2fr;
      gap: 40px;
      padding-top: 56px;
      padding-bottom: 48px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }
    .logo-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: var(--pure-white);
    }
    .brand-desc {
      font-size: 0.875rem;
      color: var(--rose-mist);
      line-height: 1.6;
      max-width: 320px;
      margin-bottom: 18px;
    }
    .jp-motto {
      display: flex;
      flex-direction: column;
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--butter-yellow);
    }
    .motto-sub {
      font-size: 0.6875rem;
      color: var(--soft-peach);
      letter-spacing: 0.05em;
    }
    .col-title {
      font-size: 0.9375rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--pure-white);
      margin-bottom: 18px;
    }
    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .footer-links a {
      font-size: 0.84375rem;
      color: var(--rose-mist);
      transition: color var(--transition-fast), padding-left var(--transition-fast);
    }
    .footer-links a:hover {
      color: var(--butter-yellow);
      padding-left: 4px;
    }
    .admin-link {
      color: var(--vermilion) !important;
      font-weight: 700;
    }
    .footer-text {
      font-size: 0.8125rem;
      color: var(--rose-mist);
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .support-box {
      background-color: rgba(255, 248, 244, 0.06);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(246, 221, 213, 0.12);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .support-label {
      font-size: 0.6875rem;
      color: var(--warm-taupe);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .support-email {
      font-size: 0.8125rem;
      color: var(--pure-white);
      font-weight: 600;
    }
    .copyright-bar {
      border-top: 1px solid rgba(246, 221, 213, 0.1);
      padding: 20px 0;
      font-size: 0.75rem;
      color: var(--warm-taupe);
    }
    .copyright-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .tokyo-tag {
      font-family: 'Noto Sans JP', sans-serif;
      letter-spacing: 0.1em;
      color: var(--soft-peach);
    }
    @media (max-width: 992px) {
      .footer-container {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 600px) {
      .footer-container {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }
  `]
})
export class FooterComponent {
  readonly authService = inject(AuthService);
}
