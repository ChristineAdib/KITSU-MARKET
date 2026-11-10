import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <div class="container auth-container">
        
        <div class="auth-card">
          
          <!-- Left Column: Form -->
          <div class="auth-form-side">
            <div class="auth-header">
              <span class="jp-tag">ログイン • SIGN IN</span>
              <h1 class="auth-title">Welcome Back</h1>
              <p class="auth-subtitle">Sign in to access your saved bag, orders, and anime collection.</p>
            </div>

            @if (errorMessage()) {
              <div class="alert-error" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
              
              <!-- Email -->
              <div class="form-group">
                <label class="form-label" for="loginEmail">Email Address</label>
                <input 
                  id="loginEmail"
                  type="email" 
                  class="form-control" 
                  [(ngModel)]="email" 
                  name="email" 
                  required 
                  email
                  placeholder="e.g. collector@kitsumarket.com"
                  #emailInput="ngModel"
                />
                @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
                  <span class="form-error">Please enter a valid email address.</span>
                }
              </div>

              <!-- Password with Visibility Toggle -->
              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="loginPassword">Password</label>
                  <button type="button" class="pwd-toggle" (click)="togglePasswordVisibility()">
                    {{ showPassword() ? 'Hide' : 'Show' }}
                  </button>
                </div>
                <div class="password-input-wrap">
                  <input 
                    id="loginPassword"
                    [type]="showPassword() ? 'text' : 'password'" 
                    class="form-control" 
                    [(ngModel)]="password" 
                    name="password" 
                    required 
                    minlength="6"
                    placeholder="Enter your password"
                    #passwordInput="ngModel"
                  />
                </div>
                @if (passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)) {
                  <span class="form-error">Password must be at least 6 characters.</span>
                }
              </div>

              <!-- Demo Credentials Helper -->
              <div class="demo-creds-hint">
                <span class="hint-label">Development Quick Login:</span>
                <button type="button" class="demo-chip" (click)="fillAdminCredentials()">
                  Fill Admin Account
                </button>
              </div>

              <!-- Submit Button -->
              <button 
                type="submit" 
                class="btn btn-primary btn-lg submit-btn" 
                [disabled]="loginForm.invalid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="btn-spinner"></span>
                  <span>Authenticating...</span>
                } @else {
                  <span>Sign In to Account</span>
                }
              </button>
            </form>

            <div class="auth-footer">
              <p>Don't have an account yet? <a routerLink="/register">Create customer account</a></p>
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
              <span class="art-brand">KITSU MARKET</span>
              <p class="art-quote">"Curating the finest anime collectibles for dedicated fans across Egypt."</p>
              <div class="art-tags">
                <span>AUTHENTIC</span> • <span>EGP PRICED</span> • <span>REAL-TIME INVENTORY</span>
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
    .pwd-toggle:hover {
      text-decoration: underline;
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
    .auth-footer a:hover {
      text-decoration: underline;
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
    .demo-creds-hint {
      margin-bottom: 20px;
      padding: 10px 14px;
      background-color: var(--porcelain);
      border: 1px dashed var(--soft-peach);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .hint-label {
      font-size: 0.75rem;
      color: var(--warm-taupe);
      font-weight: 600;
    }
    .demo-chip {
      background-color: var(--butter-yellow);
      color: var(--cocoa-brown);
      padding: 4px 10px;
      border-radius: var(--radius-xs);
      font-size: 0.75rem;
      font-weight: 700;
      transition: opacity var(--transition-fast);
    }
    .demo-chip:hover {
      opacity: 0.85;
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
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  showPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  fillAdminCredentials(): void {
    this.email = 'admin@kitsumarket.com';
    this.password = 'Admin@KitsuMarket2026!';
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const request: LoginRequest = {
      email: this.email.trim(),
      password: this.password
    };

    this.authService.login(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }
}
