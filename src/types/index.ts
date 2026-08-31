export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface UserContext {
  id: string;
  email: string;
  username: string;
  role?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponseFormat<T = any> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data?: T;
  meta?: PaginationMeta | Record<string, any>;
  errors?: any[];
  timestamp: string;
}
