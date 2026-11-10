export interface CreateOrderRequest {
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
}

export interface OrderItem {
  id: number;
  productId?: number;
  productName: string;
  productImageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDetails {
  id: number;
  orderNumber: string;
  userId: string;
  createdAtUtc: string;
  status: string;
  totalAmount: number;
  totalItems: number;
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  items: OrderItem[];
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  createdAtUtc: string;
  status: string;
  totalAmount: number;
  totalItems: number;
  shippingCity: string;
}

export interface AdminOrderDetails extends OrderDetails {
  customerEmail: string;
  customerFullName: string;
}

export interface AdminOrderSummary extends OrderSummary {
  userId: string;
  customerEmail: string;
  customerFullName: string;
  shippingFullName: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

export interface AdminOrderQuery {
  status?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}
