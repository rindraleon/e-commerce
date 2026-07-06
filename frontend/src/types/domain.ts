export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  imageUrl?: string;
  products?: Product[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface Product {
  id: string;
  categoryId?: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  price: number;
  stock: number;
  weightKg?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: Category | null;
  images: ProductImage[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  category?: string | null;
  tags: string[];
  excerpt?: string | null;
  excerptEn?: string | null;
  content: string;
  contentEn?: string | null;
  coverImageUrl?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  user?: AuthUser | null;
}

export interface ArticleEngagement {
  articleId: string;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  profile?: UserProfile | null;
}

export interface UserProfile {
  id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  userId?: string;
  label: string;
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  userId?: string;
  productId: string;
  quantity: number;
  addedAt?: string;
  product: Product;
  totalPrice?: number;
}

export interface CartResponse {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

export interface WishlistItem {
  id: string;
  userId?: string;
  productId: string;
  createdAt?: string;
  product: Product;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  type: string;
  value: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  isSingleUsePerUser?: boolean;
  isForNewCustomers?: boolean;
  allowedCategoryIds?: string[];
  allowedProductIds?: string[];
  startsAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponValidationResult {
  couponId: string;
  code: string;
  description?: string | null;
  type: string;
  value: number;
  discountAmount: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  isSingleUsePerUser?: boolean;
  isForNewCustomers?: boolean;
  allowedCategoryIds?: string[];
  allowedProductIds?: string[];
}

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product?: Product;
  createdAt?: string;
}

export interface Payment {
  id: string;
  orderId?: string;
  paymentMethod: string;
  transactionId?: string;
  payerPhone?: string | null;
  proofImageUrl?: string | null;
  amount: number;
  status: string;
  paymentDate?: string | null;
  createdAt?: string;
}

export interface PaymentRecord extends Payment {
  order?: Order | null;
  user?: AuthUser | null;
}

export interface PaymentSummary {
  totalPayments: number;
  completedRevenue: number;
  pendingAmount: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  refundedCount: number;
  byMethod: {
    mvola: number;
    airtelMoney: number;
    orangeMoney: number;
  };
}

export interface Order {
  id: string;
  userId?: string;
  addressId?: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  address?: Address | null;
  orderItems: OrderItem[];
  payments: Payment[];
  user?: AuthUser | null;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  moderationStatus: string;
  createdAt?: string;
  updatedAt?: string;
  user?: AuthUser | null;
  product?: Product | null;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: string;
  requestedAt?: string;
  resolvedAt?: string | null;
  createdAt?: string;
  order?: Order | null;
  user?: AuthUser | null;
}

export interface UserSummary {
  id: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  profile?: UserProfile | null;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt?: string;
  admin?: AuthUser | null;
}

export interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  source?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingReviews: number;
  pendingReturns: number;
  recentOrders: Order[];
  paymentsOverview?: PaymentSummary;
}

export interface AnalyticsSeriesPoint {
  date: string;
  orders?: number;
  paidOrders?: number;
  revenue?: number;
  payments?: number;
  amount?: number;
  newUsers?: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  amount?: number;
}

export interface PaymentMethodBreakdownItem {
  method: string;
  count: number;
  amount: number;
}

export interface TopProductAnalyticsItem {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
  orderCount: number;
  stock: number;
}

export interface CategoryPerformanceItem {
  categoryId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface TopArticleAnalyticsItem {
  articleId: string;
  slug: string;
  title: string;
  likeCount: number;
  commentCount: number;
  score: number;
  publishedAt?: string | null;
}

export interface AdminAnalyticsOverview {
  averageOrderValue: number;
  repeatCustomers: number;
  activeSubscribers: number;
  publishedArticles: number;
  approvedComments: number;
  articleLikes: number;
  newUsers: number;
}

export interface AdminAnalytics {
  periodDays: number;
  generatedAt: string;
  overview: AdminAnalyticsOverview;
  salesTimeline: AnalyticsSeriesPoint[];
  paymentTimeline: AnalyticsSeriesPoint[];
  customerGrowth: AnalyticsSeriesPoint[];
  orderStatusBreakdown: StatusBreakdownItem[];
  paymentStatusBreakdown: StatusBreakdownItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  topProducts: TopProductAnalyticsItem[];
  categoryPerformance: CategoryPerformanceItem[];
  topArticles: TopArticleAnalyticsItem[];
}
