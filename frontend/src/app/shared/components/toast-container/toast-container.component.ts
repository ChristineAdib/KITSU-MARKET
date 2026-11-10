import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="toastService.remove(toast.id)">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            } @else if (toast.type === 'error') {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            } @else {
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            }
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" type="button" aria-label="Close" (click)="toastService.remove(toast.id)">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 60px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 380px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--pure-white);
      border-radius: var(--radius-sm);
      border: 1px solid var(--rose-mist);
      box-shadow: 0 8px 24px rgba(91, 68, 59, 0.12);
      color: var(--cocoa-brown);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: opacity 0.2s, transform 0.2s;
    }
    .toast-success {
      border-left: 4px solid var(--matcha-olive);
    }
    .toast-success .toast-icon {
      color: var(--matcha-olive);
    }
    .toast-error {
      border-left: 4px solid var(--vermilion);
    }
    .toast-error .toast-icon {
      color: var(--vermilion);
    }
    .toast-info {
      border-left: 4px solid var(--soft-peach);
    }
    .toast-info .toast-icon {
      color: var(--cocoa-brown);
    }
    .toast-message {
      flex: 1;
      line-height: 1.4;
    }
    .toast-close {
      font-size: 1.25rem;
      line-height: 1;
      color: var(--warm-taupe);
      padding: 0 4px;
    }
    .toast-close:hover {
      color: var(--cocoa-brown);
    }
    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @media (max-width: 480px) {
      .toast-container {
        top: 20px;
        left: 16px;
        right: 16px;
        max-width: none;
      }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
