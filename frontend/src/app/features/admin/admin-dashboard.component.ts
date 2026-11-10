import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { AdminOrderService } from '../../core/services/admin-order.service';
import { ToastService } from '../../core/services/toast.service';
import { Category, CreateCategoryRequest, CreateProductRequest, Product, UpdateProductRequest } from '../../core/models/product.models';
import { AdminOrderSummary } from '../../core/models/order.models';

type AdminTab = 'overview' | 'products' | 'orders' | 'categories';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="admin-page">
      <div class="container admin-container">
        
        <!-- Top Banner -->
        <header class="admin-header fade-in">
          <div class="header-titles">
            <span class="jp-sub">管理ポータル • CONTROL SYSTEM</span>
            <h1 class="admin-title">Store Management</h1>
            <p class="admin-desc">Oversee your catalog, track customer orders, and manage merchandise categories.</p>
          </div>
          <div class="header-badges">
            <span class="badge badge-primary">System Admin</span>
            <span class="badge badge-success">Production API Live</span>
          </div>
        </header>

        <!-- Navigation Tabs -->
        <nav class="admin-tabs">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'overview'" 
            (click)="setTab('overview')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Overview
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'products'" 
            (click)="setTab('products')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Products ({{ products().length }})
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'orders'" 
            (click)="setTab('orders')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Orders ({{ orders().length }})
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'categories'" 
            (click)="setTab('categories')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Categories ({{ categories().length }})
          </button>
        </nav>

        <!-- ================= TAB 1: OVERVIEW ================= -->
        @if (activeTab() === 'overview') {
          <div class="tab-pane fade-in">
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-icon">📦</div>
                <div class="metric-info">
                  <span class="metric-label">Total Catalog Products</span>
                  <span class="metric-value">{{ products().length }}</span>
                  <span class="metric-sub">{{ activeProductsCount }} active • {{ inactiveProductsCount }} deactivated</span>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">📑</div>
                <div class="metric-info">
                  <span class="metric-label">Total Customer Orders</span>
                  <span class="metric-value">{{ orders().length }}</span>
                  <span class="metric-sub">{{ pendingOrdersCount }} pending fulfillment</span>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">🏷️</div>
                <div class="metric-info">
                  <span class="metric-label">Merchandise Categories</span>
                  <span class="metric-value">{{ categories().length }}</span>
                  <span class="metric-sub">Official collection lines</span>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">💰</div>
                <div class="metric-info">
                  <span class="metric-label">Gross Order Volume</span>
                  <span class="metric-value price">{{ totalGrossSales | number:'1.2-2' }} EGP</span>
                  <span class="metric-sub">Calculated from confirmed store orders</span>
                </div>
              </div>
            </div>

            <!-- Breakdown Panels -->
            <div class="overview-panels-grid">
              <!-- Orders By Status -->
              <div class="panel-card">
                <h3 class="panel-title">Orders by Status</h3>
                <div class="status-bars">
                  @for (st of statusCounts; track st.status) {
                    <div class="status-bar-row">
                      <div class="status-bar-header">
                        <span class="status-name">{{ st.status }}</span>
                        <span class="status-count">{{ st.count }} orders</span>
                      </div>
                      <div class="status-progress-track">
                        <div class="status-progress-fill" [style.width.%]="orders().length > 0 ? (st.count / orders().length) * 100 : 0"></div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Quick Operations -->
              <div class="panel-card">
                <h3 class="panel-title">Quick Actions</h3>
                <div class="quick-actions-list">
                  <button class="btn btn-primary" (click)="openProductModal()">
                    + Add New Product
                  </button>
                  <button class="btn btn-secondary" (click)="openCategoryModal()">
                    + Add New Category
                  </button>
                  <a routerLink="/shop" class="btn btn-secondary">
                    View Live Storefront
                  </a>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ================= TAB 2: PRODUCTS ================= -->
        @if (activeTab() === 'products') {
          <div class="tab-pane fade-in">
            <div class="pane-toolbar">
              <div class="toolbar-search">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Search products by title or description..." 
                  [(ngModel)]="productFilterQuery" 
                />
              </div>

              <div class="toolbar-actions">
                <select class="form-control" [(ngModel)]="productFilterCategory">
                  <option value="">All Categories</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>

                <button class="btn btn-primary" (click)="openProductModal()">
                  + Add Product
                </button>
              </div>
            </div>

            <!-- Products Table -->
            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (prod of filteredProducts; track prod.id) {
                    <tr>
                      <td>
                        <div class="item-cell">
                          <img [src]="prod.imageUrl" [alt]="prod.name" class="table-thumb" (error)="onImgError($event)" />
                          <div class="item-info">
                            <strong class="item-title">{{ prod.name }}</strong>
                            <span class="item-slug">{{ prod.slug }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="cat-tag">{{ prod.categoryName }}</span>
                      </td>
                      <td>
                        <strong class="price-text">{{ prod.price | number:'1.2-2' }} EGP</strong>
                      </td>
                      <td>
                        <span [class.stock-warning]="prod.stockQuantity <= 3">
                          {{ prod.stockQuantity }} units
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="prod.isActive ? 'badge-success' : 'badge-danger'">
                          {{ prod.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="prod.isFeatured ? 'badge-primary' : 'badge-neutral'">
                          {{ prod.isFeatured ? 'Featured' : 'Standard' }}
                        </span>
                      </td>
                      <td class="text-right">
                        <div class="row-actions">
                          <button class="btn btn-secondary btn-sm" (click)="openProductModal(prod)" title="Edit Product">
                            Edit
                          </button>
                          <button 
                            class="btn btn-sm" 
                            [ngClass]="prod.isActive ? 'btn-danger' : 'btn-primary'"
                            (click)="toggleProductActive(prod)"
                            title="Toggle active status">
                            {{ prod.isActive ? 'Deactivate' : 'Reactivate' }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="empty-table">No products found matching filter criteria.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ================= TAB 3: ORDERS ================= -->
        @if (activeTab() === 'orders') {
          <div class="tab-pane fade-in">
            <div class="pane-toolbar">
              <div class="toolbar-search">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Search orders by customer name, order #..." 
                  [(ngModel)]="orderFilterQuery" 
                />
              </div>

              <div class="toolbar-actions">
                <select class="form-control" [(ngModel)]="orderFilterStatus">
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button class="btn btn-secondary" (click)="loadOrders()">
                  Refresh Orders
                </button>
              </div>
            </div>

            <!-- Orders Table -->
            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (order of filteredOrders; track order.id) {
                    <tr>
                      <td>
                        <a [routerLink]="['/orders', order.id]" class="order-link font-mono">
                          {{ order.orderNumber }}
                        </a>
                      </td>
                      <td>
                        <div class="customer-cell">
                          <strong>{{ order.customerFullName || order.shippingFullName }}</strong>
                          <span class="customer-sub">{{ order.customerEmail || order.shippingCity }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="date-text">{{ order.createdAtUtc | date:'shortDate' }}</span>
                      </td>
                      <td>
                        <span>{{ order.totalItems }}</span>
                      </td>
                      <td>
                        <strong class="price-text">{{ order.totalAmount | number:'1.2-2' }} EGP</strong>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getOrderStatusBadgeClass(order.status)">
                          {{ order.status }}
                        </span>
                      </td>
                      <td class="text-right">
                        <select 
                          class="status-select" 
                          [ngModel]="order.status" 
                          (ngModelChange)="onOrderStatusChange(order.id, $event)">
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="empty-table">No orders found matching filter criteria.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ================= TAB 4: CATEGORIES ================= -->
        @if (activeTab() === 'categories') {
          <div class="tab-pane fade-in">
            <div class="pane-toolbar">
              <h2>Official Merchandise Categories</h2>
              <button class="btn btn-primary" (click)="openCategoryModal()">
                + Add Category
              </button>
            </div>

            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Slug</th>
                    <th>Active Products</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cat of categories(); track cat.id) {
                    <tr>
                      <td>
                        <div class="item-cell">
                          @if (cat.imageUrl) {
                            <img [src]="cat.imageUrl" [alt]="cat.name" class="table-thumb" (error)="onImgError($event)" />
                          } @else {
                            <div class="placeholder-thumb">📁</div>
                          }
                          <strong>{{ cat.name }}</strong>
                        </div>
                      </td>
                      <td>
                        <code class="slug-code">{{ cat.slug }}</code>
                      </td>
                      <td>
                        <span class="badge badge-neutral">{{ cat.productCount }} products</span>
                      </td>
                      <td class="text-right">
                        <div class="row-actions">
                          <button class="btn btn-secondary btn-sm" (click)="openCategoryModal(cat)">
                            Edit
                          </button>
                          @if (cat.productCount === 0) {
                            <button class="btn btn-danger btn-sm" (click)="deleteCategory(cat)">
                              Delete
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="empty-table">No categories found.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

      </div>

      <!-- ================= PRODUCT MODAL ================= -->
      @if (showProductModal()) {
        <div class="modal-overlay" (click)="closeProductModal()">
          <div class="modal-card fade-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingProduct() ? 'Edit Product' : 'Add New Collectible' }}</h3>
              <button class="modal-close" (click)="closeProductModal()">✕</button>
            </div>

            <form (ngSubmit)="saveProduct()" class="modal-form">
              <div class="form-group">
                <label class="form-label">Product Name *</label>
                <input type="text" class="form-control" [(ngModel)]="productForm.name" name="name" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Category *</label>
                  <select class="form-control" [(ngModel)]="productForm.categoryId" name="categoryId" required>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Price (EGP) *</label>
                  <input type="number" step="0.01" class="form-control" [(ngModel)]="productForm.price" name="price" required min="1" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Stock Quantity *</label>
                  <input type="number" class="form-control" [(ngModel)]="productForm.stockQuantity" name="stockQuantity" required min="0" />
                </div>

                <div class="form-group">
                  <label class="form-label">Image URL *</label>
                  <input type="url" class="form-control" [(ngModel)]="productForm.imageUrl" name="imageUrl" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description *</label>
                <textarea class="form-control" rows="4" [(ngModel)]="productForm.description" name="description" required></textarea>
              </div>

              <div class="form-checkboxes">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="productForm.isActive" name="isActive" />
                  <span>Is Active (Publicly visible on storefront)</span>
                </label>

                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="productForm.isFeatured" name="isFeatured" />
                  <span>Is Featured (Highlighted on homepage)</span>
                </label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeProductModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmittingProduct()">
                  {{ isSubmittingProduct() ? 'Saving...' : 'Save Product' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ================= CATEGORY MODAL ================= -->
      @if (showCategoryModal()) {
        <div class="modal-overlay" (click)="closeCategoryModal()">
          <div class="modal-card fade-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingCategory() ? 'Edit Category' : 'Create New Category' }}</h3>
              <button class="modal-close" (click)="closeCategoryModal()">✕</button>
            </div>

            <form (ngSubmit)="saveCategory()" class="modal-form">
              <div class="form-group">
                <label class="form-label">Category Name *</label>
                <input type="text" class="form-control" [(ngModel)]="categoryForm.name" name="catName" required />
              </div>

              <div class="form-group">
                <label class="form-label">Image URL (Optional)</label>
                <input type="url" class="form-control" [(ngModel)]="categoryForm.imageUrl" name="catImageUrl" />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeCategoryModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSubmittingCategory()">
                  {{ isSubmittingCategory() ? 'Saving...' : 'Save Category' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </main>
  `,
  styles: [`
    .admin-page {
      padding: 2.5rem 0 5rem;
      background-color: var(--color-porcelain);
      min-height: 80vh;
    }

    .admin-container {
      max-width: 1200px;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--color-rose-mist);
    }

    .jp-sub {
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--color-deep-cherry);
      display: block;
      margin-bottom: 0.25rem;
    }

    .admin-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--color-cocoa);
      margin-bottom: 0.35rem;
    }

    .admin-desc {
      color: var(--color-warm-taupe);
      font-size: 0.9375rem;
    }

    .header-badges {
      display: flex;
      gap: 0.5rem;
    }

    .admin-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--color-rose-mist);
      margin-bottom: 2rem;
      overflow-x: auto;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--color-warm-taupe);
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--color-cocoa);
    }

    .tab-btn.active {
      color: var(--color-vermilion);
      border-bottom-color: var(--color-vermilion);
    }

    /* Overview Pane */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .metric-icon {
      font-size: 2.25rem;
      width: 54px;
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-porcelain);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-rose-mist);
      flex-shrink: 0;
    }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-warm-taupe);
      font-weight: 600;
    }

    .metric-value {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--color-cocoa);
      line-height: 1.2;
    }

    .metric-value.price {
      color: var(--color-vermilion);
    }

    .metric-sub {
      font-size: 0.75rem;
      color: var(--color-warm-taupe);
      margin-top: 0.25rem;
    }

    .overview-panels-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    .panel-card {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      padding: 1.75rem;
    }

    .panel-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-cocoa);
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-rose-mist);
    }

    .status-bars {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .status-bar-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-cocoa);
      margin-bottom: 0.25rem;
    }

    .status-progress-track {
      height: 8px;
      background: var(--color-porcelain);
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--color-rose-mist);
    }

    .status-progress-fill {
      height: 100%;
      background: var(--color-vermilion);
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .quick-actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Common Toolbar */
    .pane-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .toolbar-search {
      flex: 1;
      min-width: 260px;
    }

    .toolbar-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* Tables */
    .table-container {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      overflow-x: auto;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .admin-table th {
      background: var(--color-porcelain);
      padding: 0.875rem 1rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-warm-taupe);
      font-weight: 700;
      border-bottom: 1px solid var(--color-rose-mist);
    }

    .admin-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--color-rose-mist);
      font-size: 0.875rem;
      color: var(--color-cocoa);
      vertical-align: middle;
    }

    .admin-table tr:last-child td {
      border-bottom: none;
    }

    .item-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .table-thumb {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      border: 1px solid var(--color-rose-mist);
      flex-shrink: 0;
    }

    .placeholder-thumb {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      background: var(--color-porcelain);
      border: 1px solid var(--color-rose-mist);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-title {
      font-weight: 700;
      color: var(--color-cocoa);
    }

    .item-slug {
      font-size: 0.75rem;
      color: var(--color-warm-taupe);
      font-family: monospace;
    }

    .cat-tag {
      background: var(--color-sakura);
      color: var(--color-deep-cherry);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .price-text {
      color: var(--color-vermilion);
      font-weight: 700;
    }

    .stock-warning {
      color: var(--color-vermilion);
      font-weight: 700;
    }

    .row-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .text-right {
      text-align: right;
    }

    .font-mono {
      font-family: monospace;
    }

    .order-link {
      font-weight: 700;
      color: var(--color-vermilion);
      text-decoration: underline;
    }

    .customer-cell {
      display: flex;
      flex-direction: column;
    }

    .customer-sub {
      font-size: 0.75rem;
      color: var(--color-warm-taupe);
    }

    .date-text {
      color: var(--color-warm-taupe);
      font-size: 0.8125rem;
    }

    .status-select {
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-rose-mist);
      background: var(--color-porcelain);
      color: var(--color-cocoa);
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    .slug-code {
      font-family: monospace;
      color: var(--color-deep-cherry);
      background: var(--color-porcelain);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.8125rem;
    }

    .empty-table {
      text-align: center;
      padding: 3rem;
      color: var(--color-warm-taupe);
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(91, 68, 59, 0.45);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-card {
      background: var(--color-white);
      border: 1px solid var(--color-rose-mist);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-rose-mist);
    }

    .modal-header h3 {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-cocoa);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--color-warm-taupe);
      cursor: pointer;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--color-porcelain);
      border-radius: var(--radius-sm);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-cocoa);
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-rose-mist);
    }

    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        gap: 1rem;
      }

      .overview-panels-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly adminOrderService = inject(AdminOrderService);
  private readonly toastService = inject(ToastService);

  readonly activeTab = signal<AdminTab>('overview');
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly orders = signal<AdminOrderSummary[]>([]);

  // Filter states
  productFilterQuery = '';
  productFilterCategory = '';
  orderFilterQuery = '';
  orderFilterStatus = '';

  // Product Modal State
  readonly showProductModal = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly isSubmittingProduct = signal(false);
  productForm: CreateProductRequest = {
    name: '',
    description: '',
    price: 100,
    stockQuantity: 10,
    imageUrl: '',
    categoryId: 1,
    isFeatured: false,
    isActive: true
  };

  // Category Modal State
  readonly showCategoryModal = signal(false);
  readonly editingCategory = signal<Category | null>(null);
  readonly isSubmittingCategory = signal(false);
  categoryForm: CreateCategoryRequest = {
    name: '',
    imageUrl: ''
  };

  ngOnInit(): void {
    this.loadAllData();
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  loadAllData(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadOrders();
  }

  loadProducts(): void {
    this.productService.getProducts({ pageSize: 50 }).subscribe({
      next: (res) => this.products.set(res.items),
      error: () => this.toastService.error('Failed to load products.')
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (cats.length > 0 && !this.productForm.categoryId) {
          this.productForm.categoryId = cats[0].id;
        }
      },
      error: () => this.toastService.error('Failed to load categories.')
    });
  }

  loadOrders(): void {
    this.adminOrderService.getOrders({ pageSize: 50 }).subscribe({
      next: (res) => this.orders.set(res.items),
      error: () => this.toastService.error('Failed to load orders.')
    });
  }

  // Filtered views
  get filteredProducts(): Product[] {
    return this.products().filter((p) => {
      const matchesSearch = !this.productFilterQuery.trim() || 
        p.name.toLowerCase().includes(this.productFilterQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(this.productFilterQuery.toLowerCase());
      
      const matchesCat = !this.productFilterCategory || 
        p.categoryId.toString() === this.productFilterCategory;

      return matchesSearch && matchesCat;
    });
  }

  get filteredOrders(): AdminOrderSummary[] {
    return this.orders().filter((o) => {
      const q = this.orderFilterQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        o.orderNumber.toLowerCase().includes(q) || 
        o.customerFullName?.toLowerCase().includes(q) || 
        o.customerEmail?.toLowerCase().includes(q) || 
        o.shippingFullName?.toLowerCase().includes(q);

      const matchesStatus = !this.orderFilterStatus || 
        o.status.toLowerCase() === this.orderFilterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }

  // Metrics
  get activeProductsCount(): number {
    return this.products().filter((p) => p.isActive).length;
  }

  get inactiveProductsCount(): number {
    return this.products().filter((p) => !p.isActive).length;
  }

  get pendingOrdersCount(): number {
    return this.orders().filter((o) => o.status === 'Pending').length;
  }

  get totalGrossSales(): number {
    return this.orders()
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  get statusCounts(): { status: string; count: number }[] {
    const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    return statuses.map((status) => ({
      status,
      count: this.orders().filter((o) => o.status === status).length
    }));
  }

  // --- Product Operations ---
  openProductModal(prod?: Product): void {
    if (prod) {
      this.editingProduct.set(prod);
      this.productForm = {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        stockQuantity: prod.stockQuantity,
        imageUrl: prod.imageUrl,
        categoryId: prod.categoryId,
        isFeatured: prod.isFeatured,
        isActive: prod.isActive
      };
    } else {
      this.editingProduct.set(null);
      this.productForm = {
        name: '',
        description: '',
        price: 150,
        stockQuantity: 10,
        imageUrl: '',
        categoryId: this.categories().length > 0 ? this.categories()[0].id : 1,
        isFeatured: false,
        isActive: true
      };
    }
    this.showProductModal.set(true);
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
    this.editingProduct.set(null);
  }

  saveProduct(): void {
    this.isSubmittingProduct.set(true);
    const editing = this.editingProduct();

    if (editing) {
      const updateDto: UpdateProductRequest = { ...this.productForm };
      this.productService.updateProduct(editing.id, updateDto).subscribe({
        next: (updated) => {
          this.toastService.success(`Product "${updated.name}" updated successfully.`);
          this.closeProductModal();
          this.loadProducts();
          this.isSubmittingProduct.set(false);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Failed to update product.');
          this.isSubmittingProduct.set(false);
        }
      });
    } else {
      this.productService.createProduct(this.productForm).subscribe({
        next: (created) => {
          this.toastService.success(`Product "${created.name}" created successfully.`);
          this.closeProductModal();
          this.loadProducts();
          this.isSubmittingProduct.set(false);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Failed to create product.');
          this.isSubmittingProduct.set(false);
        }
      });
    }
  }

  toggleProductActive(prod: Product): void {
    const newStatus = !prod.isActive;
    const updateDto: UpdateProductRequest = {
      name: prod.name,
      description: prod.description,
      price: prod.price,
      stockQuantity: prod.stockQuantity,
      imageUrl: prod.imageUrl,
      categoryId: prod.categoryId,
      isFeatured: prod.isFeatured,
      isActive: newStatus
    };

    this.productService.updateProduct(prod.id, updateDto).subscribe({
      next: () => {
        this.toastService.success(`Product ${newStatus ? 'reactivated' : 'deactivated'}.`);
        this.loadProducts();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to change product status.');
      }
    });
  }

  // --- Category Operations ---
  openCategoryModal(cat?: Category): void {
    if (cat) {
      this.editingCategory.set(cat);
      this.categoryForm = {
        name: cat.name,
        imageUrl: cat.imageUrl || ''
      };
    } else {
      this.editingCategory.set(null);
      this.categoryForm = {
        name: '',
        imageUrl: ''
      };
    }
    this.showCategoryModal.set(true);
  }

  closeCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.editingCategory.set(null);
  }

  saveCategory(): void {
    this.isSubmittingCategory.set(true);
    const editing = this.editingCategory();

    if (editing) {
      this.productService.updateCategory(editing.id, this.categoryForm).subscribe({
        next: (cat) => {
          this.toastService.success(`Category "${cat.name}" updated.`);
          this.closeCategoryModal();
          this.loadCategories();
          this.isSubmittingCategory.set(false);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Failed to update category.');
          this.isSubmittingCategory.set(false);
        }
      });
    } else {
      this.productService.createCategory(this.categoryForm).subscribe({
        next: (cat) => {
          this.toastService.success(`Category "${cat.name}" created.`);
          this.closeCategoryModal();
          this.loadCategories();
          this.isSubmittingCategory.set(false);
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Failed to create category.');
          this.isSubmittingCategory.set(false);
        }
      });
    }
  }

  deleteCategory(cat: Category): void {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    this.productService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.toastService.success(`Category "${cat.name}" deleted.`);
        this.loadCategories();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Could not delete category.');
      }
    });
  }

  // --- Order Operations ---
  onOrderStatusChange(orderId: number, newStatus: string): void {
    this.adminOrderService.updateStatus(orderId, newStatus).subscribe({
      next: (updated) => {
        this.toastService.success(`Order #${updated.orderNumber} updated to ${updated.status}.`);
        this.loadOrders();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Failed to update order status.');
      }
    });
  }

  getOrderStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'confirmed':
      case 'processing':
        return 'badge-primary';
      case 'shipped':
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
  }
}
