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
  availableCount?: number;
  isAvailable?: boolean;
  unavailableReason?: string;
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

// Asset Types (개별 자산 - 같은 상품이라도 각각 다른 코드)
export interface Asset {
  id: string;
  productId: string;
  product?: Product;
  assetCode: string;        // 고유 자산 코드 (예: NAP-001, NAP-002)
  serialNumber?: string;
  status: 'available' | 'rented' | 'maintenance' | 'retired';
  conditionGrade: string;
  condition?: string;
  images?: string[];        // 이 자산만의 실제 사진들
  notes?: string;
  blockedPeriods?: AssetBlockedPeriod[];  // 이 자산의 예약 불가 기간들
  createdAt: string;
  updatedAt: string;
}

// Asset Blocked Period (자산별 예약 불가 기간)
export interface AssetBlockedPeriod {
  id: string;
  assetId: string;
  startDate: string;
  endDate: string;
  reason: 'order' | 'maintenance' | 'manual';  // 주문, 정비, 수동차단
  orderId?: string;         // 주문으로 인한 차단시 주문 ID
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Blocked Period Types (레거시 - 상품 레벨)
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

// 주문 상태 (새 플로우)
// requested: 문의 접수됨 (사용자가 장바구니에서 문의하기 클릭)
// approved: 관리자 승인 (입금 대기 중)
// confirmed: 입금 확인됨 (예약 확정, 날짜 차단됨)
// rejected: 관리자 거절
// cancelled: 취소됨
export type OrderStatus =
  | 'requested'       // 문의 접수
  | 'approved'        // 승인됨 (입금 대기)
  | 'confirmed'       // 입금 확인 (예약 확정)
  | 'preparing'       // 준비 중
  | 'dispatched'      // 발송됨
  | 'delivered'       // 배송 완료
  | 'in_use'          // 사용 중
  | 'returned'        // 반납됨
  | 'completed'       // 완료
  | 'rejected'        // 거절됨
  | 'cancelled';      // 취소됨

// Admin Order type (different structure from customer Order)
export interface AdminOrder {
  id: string;
  status: OrderStatus;
  startDate: string;
  endDate: string;
  totalPrice: number;
  deliveryMethod: string;
  shippingAddress: string;
  deliveryNotes?: string;
  rejectionReason?: string;   // 거절 사유
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;        // 승인 시간
  confirmedAt?: string;       // 입금확인 시간
  rejectedAt?: string;        // 거절 시간
  cancelledAt?: string;       // 취소 시간
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
    assetIds?: string[];      // 배정된 자산 ID들
    product: {
      id: string;
      title: string;
      images: string[];
    };
  }>;
}

// 설정 (입금 계좌 정보 등)
export interface Settings {
  bankAccount?: {
    bank: string;           // 은행명
    accountNumber: string;  // 계좌번호
    holder: string;         // 예금주
  };
  updatedAt: string;
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

// Featured Set Types
export interface FeaturedSet {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  imageUrl: string;
  detailImages?: string[];
  videos?: string[];
  productIds: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Inquiry Types
export interface Inquiry {
  id: string;
  featuredSetId?: string;
  featuredSetTitle?: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
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
