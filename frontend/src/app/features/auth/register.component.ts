import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <div class="container auth-container">
        
        <div class="auth-card">
          
          <!-- Left Column: Form -->
          <div class="auth-form-side">
            <div class="auth-header">
              <span class="jp-tag">新規登録 • REGISTER</span>
              <h1 class="auth-title">Create Account</h1>
              <p class="auth-subtitle">Join KITSU MARKET to start collecting licensed anime merchandise.</p>
            </div>

            @if (errorMessage()) {
              <div class="alert-error" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
              
              <!-- Full Name -->
              <div class="form-group">
                <label class="form-label" for="regFullName">Full Name</label>
                <input 
                  id="regFullName"
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="fullName" 
                  name="fullName" 
                  required 
                  minlength="2"
                  placeholder="e.g. Kenji Sato"
                  #nameInput="ngModel"
                />
                @if (nameInput.invalid && (nameInput.dirty || nameInput.touched)) {
                  <span class="form-error">Please enter your full name (at least 2 characters).</span>
                }
              </div>

              <!-- Email -->
              <div class="form-group">
                <label class="form-label" for="regEmail">Email Address</label>
                <input 
                  id="regEmail"
                  type="email" 
                  class="form-control" 
                  [(ngModel)]="email" 
                  name="email" 
                  required 
                  email
                  placeholder="e.g. kenji@example.com"
                  #emailInput="ngModel"
                />
                @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
                  <span class="form-error">Please enter a valid email address.</span>
                }
              </div>

              <!-- Password -->
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="regPassword">Password</label>
                  <button type="button" class="pwd-toggle" (click)="togglePasswordVisibility()">
                    {{ showPassword() ? 'Hide' : 'Show' }}
                  </button>
                </div>
                <input 
                  id="regPassword"
                  [type]="showPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  [(ngModel)]="password" 
                  name="password" 
                  required 
                  minlength="6"
                  placeholder="At least 6 characters (uppercase, digit, symbol)"
                  #passwordInput="ngModel"
                />
                @if (passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)) {
                  <span class="form-error">Password must be at least 6 characters.</span>
                }
              </div>

              <!-- Confirm Password -->
              <div class="form-group">
                <label class="form-label" for="regConfirmPassword">Confirm Password</label>
                <input 
                  id="regConfirmPassword"
                  [type]="showPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  [(ngModel)]="confirmPassword" 
                  name="confirmPassword" 
                  required 
                  placeholder="Re-enter your password"
                />
                @if (password && confirmPassword && password !== confirmPassword) {
                  <span class="form-error">Passwords do not match.</span>
                }
              </div>

              <!-- Submit Button -->
              <button 
                type="submit" 
                class="btn btn-primary btn-lg submit-btn" 
                [disabled]="registerForm.invalid || (password !== confirmPassword) || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="btn-spinner"></span>
                  <span>Creating Account...</span>
                } @else {
                  <span>Create Account</span>
                }
              </button>
            </form>

            <div class="auth-footer">
              <p>Already have an account? <a routerLink="/login">Sign in</a></p>
            </div>
          </div>

          <!-- Right Column: Tokyo Pop Artwork Panel -->
          <div class="auth-art-side">
            <div class="art-content">
              <div class="art-logo">
                <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                  <polygon points="32,4 12,24 20,44 32,58 44,44 52,24" fill="#D94D3F"/>
                  <polygon points="32,16 20,28 26,42 32,50 38,42 44,28" fill="#FFF8F4"/>
                  <polygon points="32,24 26,34 38,34" fill="#5B443B"/>
                  <circle cx="27" cy="30" r="2" fill="#D94D3F"/>
                  <circle cx="37" cy="30" r="2" fill="#D94D3F"/>
                </svg>
              </div>
              <span class="art-brand">JOIN KITSU MARKET</span>
              <p class="art-quote">"Your portal to exclusive scale figures, limited apparel, and Japanese manga collectibles."</p>
              <div class="art-tags">
                <span>EXCLUSIVE ACCESS</span> • <span>ORDER TRACKING</span> • <span>CUSTOMER PERKS</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  `,
  styles: [`
    .auth-page {
      padding: 50px 0 80px;
    }
    .auth-container {
      max-width: 960px;
    }
    .auth-card {
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      box-shadow: var(--shadow-lg);
    }
    .auth-form-side {
      padding: 48px;
    }
    .auth-header {
      margin-bottom: 28px;
    }
    .auth-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
      margin: 4px 0 8px;
    }
    .auth-subtitle {
      font-size: 0.90625rem;
      color: var(--warm-taupe);
      line-height: 1.5;
    }
    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .pwd-toggle {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--vermilion);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .submit-btn {
      width: 100%;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    .auth-footer {
      text-align: center;
      font-size: 0.875rem;
      color: var(--warm-taupe);
      border-top: 1px solid var(--porcelain);
      padding-top: 20px;
    }
    .auth-footer a {
      color: var(--vermilion);
      font-weight: 700;
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

    /* Right Artwork Column */
    .auth-art-side {
      background-color: var(--sakura-blush);
      background-image: radial-gradient(var(--soft-peach) 1px, transparent 1px);
      background-size: 16px 16px;
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      border-left: 1px solid var(--rose-mist);
    }
    .art-content {
      text-align: center;
    }
    .art-logo {
      margin: 0 auto 16px;
    }
    .art-brand {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: var(--cocoa-brown);
      display: block;
      margin-bottom: 16px;
    }
    .art-quote {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--cocoa-brown);
      font-style: italic;
      margin-bottom: 24px;
      opacity: 0.85;
    }
    .art-tags {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--warm-taupe);
    }

    @media (max-width: 868px) {
      .auth-card {
        grid-template-columns: 1fr;
      }
      .auth-form-side {
        padding: 32px 24px;
      }
      .auth-art-side {
        display: none;
      }
    }
  `]
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.fullName || !this.email || !this.password) return;
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const request: RegisterRequest = {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/']);
      },
      error: err => {
        this.isSubmitting.set(false);
        const errorList = err.error?.errors ? err.error.errors.join(' ') : null;
        this.errorMessage.set(errorList || err.error?.message || 'Registration failed. Please check your data.');
      }
    });
  }
}
