export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface Cart {
  id: number;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
