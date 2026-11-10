import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminOrderDetails, AdminOrderQuery, AdminOrderSummary, UpdateOrderStatusRequest } from '../models/order.models';
import { PagedResult } from '../models/product.models';

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/orders`;

  getOrders(query?: AdminOrderQuery): Observable<PagedResult<AdminOrderSummary>> {
    let params = new HttpParams();

    if (query) {
      if (query.status) params = params.set('status', query.status);
      if (query.search) params = params.set('search', query.search.trim());
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.page) params = params.set('page', query.page.toString());
      if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    }

    return this.http.get<PagedResult<AdminOrderSummary>>(this.baseUrl, { params });
  }

  getOrderById(id: number): Observable<AdminOrderDetails> {
    return this.http.get<AdminOrderDetails>(`${this.baseUrl}/${id}`);
  }

  updateStatus(id: number, status: string): Observable<AdminOrderDetails> {
    const body: UpdateOrderStatusRequest = { status };
    return this.http.patch<AdminOrderDetails>(`${this.baseUrl}/${id}/status`, body);
  }
}
