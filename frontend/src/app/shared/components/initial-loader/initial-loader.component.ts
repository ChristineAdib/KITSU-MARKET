import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-initial-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!authService.isInitialized()) {
      <div class="loader-overlay" aria-busy="true" aria-label="Loading KITSU MARKET">
        <div class="loader-card">
          <!-- Stylized Origami Fox Logo -->
          <div class="logo-mark">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <!-- Geometric Fox Mask Silhouette -->
              <polygon points="32,4 12,24 20,44 32,58 44,44 52,24" fill="#D94D3F"/>
              <polygon points="32,16 20,28 26,42 32,50 38,42 44,28" fill="#FFF8F4"/>
              <polygon points="32,24 26,34 38,34" fill="#5B443B"/>
              <circle cx="27" cy="30" r="2" fill="#D94D3F"/>
              <circle cx="37" cy="30" r="2" fill="#D94D3F"/>
            </svg>
          </div>

          <div class="brand-name">KITSU MARKET</div>
          <div class="jp-sub">キツ・マーケット • TOKYO POP EDITORIAL</div>

          <div class="progress-bar">
            <div class="progress-indicator"></div>
          </div>

          <p class="loader-message">Preparing your next favorite find...</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background-color: var(--porcelain);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.4s ease, visibility 0.4s ease;
    }
    .loader-card {
      text-align: center;
      padding: 32px;
      max-width: 360px;
      animation: fadeIn 0.4s ease;
    }
    .logo-mark {
      margin: 0 auto 16px;
      width: 64px;
      height: 64px;
      animation: floatBreath 2.4s ease-in-out infinite;
    }
    .brand-name {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: var(--cocoa-brown);
      margin-bottom: 4px;
    }
    .jp-sub {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: var(--warm-taupe);
      margin-bottom: 24px;
      text-transform: uppercase;
    }
    .progress-bar {
      width: 140px;
      height: 3px;
      background-color: var(--sakura-blush);
      border-radius: var(--radius-full);
      margin: 0 auto 16px;
      overflow: hidden;
      position: relative;
    }
    .progress-indicator {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 50%;
      background-color: var(--vermilion);
      border-radius: var(--radius-full);
      animation: progressSlide 1.4s ease-in-out infinite;
    }
    .loader-message {
      font-size: 0.84375rem;
      font-weight: 500;
      color: var(--warm-taupe);
      letter-spacing: 0.02em;
    }
    @keyframes floatBreath {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }
    @keyframes progressSlide {
      0% {
        left: -50%;
        width: 30%;
      }
      50% {
        width: 60%;
      }
      100% {
        left: 100%;
        width: 30%;
      }
    }
  `]
})
export class InitialLoaderComponent {
  readonly authService = inject(AuthService);
}
