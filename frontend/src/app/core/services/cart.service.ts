import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddToCartRequest, Cart, UpdateCartItemRequest } from '../models/cart.models';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly baseUrl = `${environment.apiUrl}/cart`;

  readonly cart = signal<Cart | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly itemCount = computed(() => this.cart()?.totalItems ?? 0);
  readonly totalAmount = computed(() => this.cart()?.totalAmount ?? 0);

  constructor() {
    // When authentication state changes, reload cart or clear it
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth) {
        this.loadCart().subscribe();
      } else {
        this.cart.set(null);
      }
    });
  }

  loadCart(): Observable<Cart | null> {
    if (!this.authService.isAuthenticated()) {
      this.cart.set(null);
      return of(null);
    }

    this.isLoading.set(true);
    return this.http.get<Cart>(this.baseUrl).pipe(
      tap(cart => {
        this.cart.set(cart);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return of(null);
      })
    );
  }

  addItem(productId: number, quantity = 1): Observable<Cart> {
    const body: AddToCartRequest = { productId, quantity };
    this.isLoading.set(true);

    return this.http.post<Cart>(`${this.baseUrl}/items`, body).pipe(
      tap(updatedCart => {
        this.cart.set(updatedCart);
        this.isLoading.set(false);
        this.toast.success('Item added to your shopping bag.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Could not add item to cart.';
        this.toast.error(msg);
        throw err;
      })
    );
  }

  updateQuantity(productId: number, quantity: number): Observable<Cart> {
    const body: UpdateCartItemRequest = { quantity };
    this.isLoading.set(true);

    return this.http.put<Cart>(`${this.baseUrl}/items/${productId}`, body).pipe(
      tap(updatedCart => {
        this.cart.set(updatedCart);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Could not update quantity.';
        this.toast.error(msg);
        throw err;
      })
    );
  }

  removeItem(productId: number): Observable<Cart> {
    this.isLoading.set(true);
    return this.http.delete<Cart>(`${this.baseUrl}/items/${productId}`).pipe(
      tap(updatedCart => {
        this.cart.set(updatedCart);
        this.isLoading.set(false);
        this.toast.info('Item removed from cart.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Could not remove item.';
        this.toast.error(msg);
        throw err;
      })
    );
  }

  clearCart(): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(this.baseUrl).pipe(
      tap(() => {
        const current = this.cart();
        if (current) {
          this.cart.set({
            ...current,
            items: [],
            totalItems: 0,
            totalAmount: 0
          });
        }
        this.isLoading.set(false);
        this.toast.info('Your cart has been cleared.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        throw err;
      })
    );
  }
}
