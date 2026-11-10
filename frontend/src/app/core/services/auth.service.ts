import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.models';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'kitsu_market_jwt_token';
  private readonly USER_KEY = 'kitsu_market_user';

  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.roles.includes('Admin') ?? false);
  readonly isInitialized = signal<boolean>(false);

  constructor() {
    this.initAuth();
  }

  private initAuth(): void {
    const token = this.getToken();
    if (token) {
      this.getMe().subscribe({
        next: () => this.isInitialized.set(true),
        error: () => {
          this.logout(false);
          this.isInitialized.set(true);
        }
      });
    } else {
      this.isInitialized.set(true);
    }
  }

  getToken(): string | null {
    try {
      return sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setToken(token: string): void {
    try {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  private getStoredUser(): User | null {
    try {
      const data = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setStoredUser(user: User): void {
    try {
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  private clearStorage(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(response => {
        this.setToken(response.token);
        const user: User = {
          id: response.id,
          fullName: response.fullName,
          email: response.email,
          roles: response.roles
        };
        this.setStoredUser(user);
        this.currentUser.set(user);
        this.toast.success(`Welcome to KITSU MARKET, ${user.fullName}!`);
      })
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => {
        this.setToken(response.token);
        const user: User = {
          id: response.id,
          fullName: response.fullName,
          email: response.email,
          roles: response.roles
        };
        this.setStoredUser(user);
        this.currentUser.set(user);
        this.toast.success(`Welcome back, ${user.fullName}!`);
      })
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap(user => {
        this.setStoredUser(user);
        this.currentUser.set(user);
      })
    );
  }

  logout(showToast = true): void {
    this.clearStorage();
    this.currentUser.set(null);
    if (showToast) {
      this.toast.info('You have been logged out.');
    }
    this.router.navigate(['/login']);
  }
}
