export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  imageUrl?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  categoryId: number;
  category: Category;
  isActive: boolean;
  isFeatured: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  categoryId: number;
  isFeatured: boolean;
  isActive: boolean;
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  categoryId: number;
  isFeatured: boolean;
  isActive: boolean;
}

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
