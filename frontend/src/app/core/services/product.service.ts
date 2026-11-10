import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Category,
  CreateCategoryRequest,
  CreateProductRequest,
  PagedResult,
  Product,
  ProductDetails,
  ProductQuery,
  UpdateCategoryRequest,
  UpdateProductRequest
} from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getProducts(query?: ProductQuery): Observable<PagedResult<Product>> {
    let params = new HttpParams();

    if (query) {
      if (query.search) params = params.set('search', query.search.trim());
      if (query.categoryId) params = params.set('categoryId', query.categoryId.toString());
      if (query.minPrice !== undefined && query.minPrice !== null) params = params.set('minPrice', query.minPrice.toString());
      if (query.maxPrice !== undefined && query.maxPrice !== null) params = params.set('maxPrice', query.maxPrice.toString());
      if (query.isFeatured !== undefined && query.isFeatured !== null) params = params.set('isFeatured', query.isFeatured.toString());
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.page) params = params.set('page', query.page.toString());
      if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    }

    return this.http.get<PagedResult<Product>>(`${this.baseUrl}/products`, { params });
  }

  getProductById(id: number): Observable<ProductDetails> {
    return this.http.get<ProductDetails>(`${this.baseUrl}/products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/categories/${id}`);
  }

  // --- Admin Operations ---
  createProduct(dto: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, dto);
  }

  updateProduct(id: number, dto: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${id}`, dto);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  createCategory(dto: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, dto);
  }

  updateCategory(id: number, dto: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, dto);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }
}
