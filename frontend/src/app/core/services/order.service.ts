import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderRequest, OrderDetails, OrderSummary } from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  checkout(request: CreateOrderRequest): Observable<OrderDetails> {
    return this.http.post<OrderDetails>(this.baseUrl, request);
  }

  getMyOrders(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(`${this.baseUrl}/my-orders`);
  }

  getOrderById(id: number): Observable<OrderDetails> {
    return this.http.get<OrderDetails>(`${this.baseUrl}/${id}`);
  }
}
