// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'supplier';
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: Category;
  supplierId: string;
  supplier?: Supplier;
  baseDailyPrice: string;
  status: 'active' | 'inactive';
  images: string[];
  detailImages?: string[];
  tags?: Tag[];
  assets?: Asset[];
  availableCount: number;
  createdAt: string;
  updatedAt: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// Asset Types
export interface Asset {
  id: string;
  productId: string;
  product?: Product;
  assetCode: string;
  serialNumber?: string;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  conditionGrade: string;
  condition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Blocked Period Types
export interface BlockedPeriod {
  id: string;
  productId: string;
  blockedStart: string;
  blockedEnd: string;
  reason: string;
  availableCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Cart Types
export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: Product;
  quantity: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Rental {
  id: number;
  orderId: number;
  assetId: number;
  asset: Asset;
  blockedStart: string;
  blockedEnd: string;
  quantity: number;
  dailyRate: string;
  subtotal: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: string;
  user?: User;
  rentals: Rental[];
  totalAmount: string;
  fulfillmentStatus: OrderStatus;
  deliveryMethod: 'pickup' | 'delivery';
  shippingAddress?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'requested'
  | 'hold_pendingpay'
  | 'confirmed'
  | 'preparing'
  | 'dispatched'
  | 'delivered'
  | 'returned'
  | 'inspecting'
  | 'inspection_passed'
  | 'inspection_failed'
  | 'rejected'
  | 'canceled'
  | 'expired'
  | 'pending'
  | 'in_transit'
  | 'in_use'
  | 'returning'
  | 'completed'
  | 'cancelled';

// Admin Order type (different structure from customer Order)
export interface AdminOrder {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  deliveryMethod: string;
  shippingAddress: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    pricePerDay: number;
    product: {
      id: string;
      title: string;
      images: string[];
    };
  }>;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// Admin Types
export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: AdminOrder[];
  recentProducts: Product[];
}

// Form Data Types
export interface ProductFormData {
  title: string;
  description: string;
  categoryId: string;
  baseDailyPrice: string;
  tags: string[];
  images: string[];
  detailImages: string[];
  status: 'active' | 'inactive';
}

export interface CategoryFormData {
  name: string;
  slug: string;
  parentId: string;
}

export interface AssetFormData {
  serialNumber: string;
  condition: string;
}

export interface BlockedPeriodFormData {
  startDate: string;
  endDate: string;
  reason: string;
}

// Search and Filter Types
export interface SearchParams {
  startDate?: string;
  endDate?: string;
  q?: string;
  tags?: string;
  categoryId?: string;
  includeUnavailable?: boolean;
}

export interface AdminProductParams {
  status?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface AdminOrderParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserParams {
  role?: string;
  page?: number;
  limit?: number;
}

// Component Prop Types
export interface IconProps {
  className?: string;
  size?: number;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
}

export interface ImageUploadProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  helperText?: string;
}

export interface RentalCalendarProps {
  blockedPeriods: BlockedPeriod[];
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}
