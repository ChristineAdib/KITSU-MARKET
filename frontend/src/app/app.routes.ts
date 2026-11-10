import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { ShopComponent } from './features/shop/shop.component';
import { ProductDetailsComponent } from './features/products/product-details.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { CartComponent } from './features/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { OrderConfirmationComponent } from './features/orders/order-confirmation.component';
import { AccountComponent } from './features/account/account.component';
import { OrderHistoryComponent } from './features/orders/order-history.component';
import { OrderDetailsComponent } from './features/orders/order-details.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'KITSU MARKET | Authentic Anime Merchandise & Tokyo Collectibles'
  },
  {
    path: 'shop',
    component: ShopComponent,
    title: 'Catalog | KITSU MARKET'
  },
  {
    path: 'products/:id',
    component: ProductDetailsComponent,
    title: 'Product Details | KITSU MARKET'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Sign In | KITSU MARKET'
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Create Account | KITSU MARKET'
  },
  {
    path: 'cart',
    component: CartComponent,
    title: 'Shopping Cart | KITSU MARKET'
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
    title: 'Checkout | KITSU MARKET'
  },
  {
    path: 'orders/confirmation/:id',
    component: OrderConfirmationComponent,
    canActivate: [authGuard],
    title: 'Order Confirmed | KITSU MARKET'
  },
  {
    path: 'account',
    component: AccountComponent,
    canActivate: [authGuard],
    title: 'Customer Profile | KITSU MARKET'
  },
  {
    path: 'orders',
    component: OrderHistoryComponent,
    canActivate: [authGuard],
    title: 'My Orders | KITSU MARKET'
  },
  {
    path: 'orders/:id',
    component: OrderDetailsComponent,
    canActivate: [authGuard],
    title: 'Order Status | KITSU MARKET'
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [adminGuard],
    title: 'Admin Control Center | KITSU MARKET'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
