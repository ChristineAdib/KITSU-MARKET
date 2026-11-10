export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  createdAtUtc?: string;
}

export interface AuthResponse {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  token: string;
  expiresAtUtc: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
