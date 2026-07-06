import {
  Address,
  AdminAnalytics,
  AdminLog,
  AdminStats,
  AnalyticsSeriesPoint,
  Article,
  AuthUser,
  CartItem,
  CartResponse,
  Category,
  CategoryPerformanceItem,
  Coupon,
  CouponValidationResult,
  ListResponse,
  Order,
  OrderItem,
  PaginationMeta,
  Payment,
  PaymentMethodBreakdownItem,
  PaymentRecord,
  PaymentSummary,
  Product,
  ProductImage,
  ReturnRequest,
  Review,
  StatusBreakdownItem,
  Subscriber,
  TopArticleAnalyticsItem,
  TopProductAnalyticsItem,
  UserProfile,
  UserSummary,
  WishlistItem,
} from '@/types/domain';

const defaultMeta: PaginationMeta = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

const asNumber = (value: unknown, fallback = 0) => {
  const result = Number(value);
  return Number.isNaN(result) ? fallback : result;
};

const asBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);

const getObject = (value: unknown): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  return {};
};

export const getField = <T = any>(source: Record<string, any>, ...keys: string[]): T | undefined => {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key] as T;
  }
  return undefined;
};

export const normalizeProfile = (raw: unknown): UserProfile | null => {
  const source = getObject(raw);
  if (!Object.keys(source).length) return null;

  return {
    id: getField(source, 'id'),
    userId: getField(source, 'userId', 'user_id'),
    fullName: getField(source, 'fullName', 'full_name'),
    email: getField(source, 'email'),
    phone: getField(source, 'phone'),
    avatarUrl: getField(source, 'avatarUrl', 'avatar_url'),
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
  };
};

export const normalizeUser = (raw: unknown): AuthUser | null => {
  const source = getObject(raw);
  if (!Object.keys(source).length) return null;

  return {
    id: getField(source, 'id', 'userId', 'user_id') || '',
    email: getField(source, 'email') || '',
    role: getField(source, 'role'),
    profile: normalizeProfile(getField(source, 'profile', 'profiles')),
  };
};

export const normalizeCategory = (raw: unknown): Category => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    name: getField(source, 'name') || '',
    nameEn: getField(source, 'nameEn', 'name_en'),
    description: getField(source, 'description'),
    descriptionEn: getField(source, 'descriptionEn', 'description_en'),
    icon: getField(source, 'icon'),
    imageUrl: getField(source, 'imageUrl', 'image_url'),
    products: asArray(getField(source, 'products')).map(normalizeProduct),
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
  };
};

export const normalizeProductImage = (raw: unknown): ProductImage => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    productId: getField(source, 'productId', 'product_id') || '',
    imageUrl: getField(source, 'imageUrl', 'image_url') || '',
    isPrimary: asBoolean(getField(source, 'isPrimary', 'is_primary')),
    sortOrder: asNumber(getField(source, 'sortOrder', 'sort_order')),
    createdAt: getField(source, 'createdAt', 'created_at'),
  };
};

export const normalizeProduct = (raw: unknown): Product => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    categoryId: getField(source, 'categoryId', 'category_id'),
    name: getField(source, 'name') || '',
    nameEn: getField(source, 'nameEn', 'name_en'),
    description: getField(source, 'description'),
    descriptionEn: getField(source, 'descriptionEn', 'description_en'),
    price: asNumber(getField(source, 'price')),
    stock: asNumber(getField(source, 'stock')),
    weightKg: getField(source, 'weightKg', 'weight_kg'),
    isFeatured: asBoolean(getField(source, 'isFeatured', 'is_featured')),
    isNew: asBoolean(getField(source, 'isNew', 'is_new')),
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
    category: getField(source, 'category', 'categories') ? normalizeCategory(getField(source, 'category', 'categories')) : null,
    images: asArray(getField(source, 'images', 'product_images')).map(normalizeProductImage),
  };
};

export const normalizeArticle = (raw: unknown): Article => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    slug: getField(source, 'slug') || '',
    title: getField(source, 'title') || '',
    titleEn: getField(source, 'titleEn', 'title_en') || null,
    category: getField(source, 'category') || null,
    tags: asArray<string>(getField(source, 'tags')).filter(Boolean),
    excerpt: getField(source, 'excerpt') || null,
    excerptEn: getField(source, 'excerptEn', 'excerpt_en') || null,
    content: getField(source, 'content') || '',
    contentEn: getField(source, 'contentEn', 'content_en') || null,
    coverImageUrl: getField(source, 'coverImageUrl', 'cover_image_url') || null,
    isPublished: asBoolean(getField(source, 'isPublished', 'is_published')),
    publishedAt: getField(source, 'publishedAt', 'published_at') || null,
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
  };
};

export const normalizeArticleComment = (raw: unknown): ArticleComment => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    articleId: getField(source, 'articleId', 'article_id') || '',
    userId: getField(source, 'userId', 'user_id') || '',
    content: getField(source, 'content') || '',
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
    user: normalizeUser(getField(source, 'user')),
  };
};

export const normalizeArticleEngagement = (raw: unknown): ArticleEngagement => {
  const source = getObject(raw);
  return {
    articleId: getField(source, 'articleId', 'article_id') || '',
    likeCount: asNumber(getField(source, 'likeCount', 'like_count')),
    commentCount: asNumber(getField(source, 'commentCount', 'comment_count')),
    likedByCurrentUser: asBoolean(
      getField(source, 'likedByCurrentUser', 'liked_by_current_user'),
    ),
  };
};

export const normalizeAddress = (raw: unknown): Address => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    userId: getField(source, 'userId', 'user_id'),
    label: getField(source, 'label') || 'Domicile',
    street: getField(source, 'street') || '',
    city: getField(source, 'city') || '',
    state: getField(source, 'state'),
    postalCode: getField(source, 'postalCode', 'postal_code'),
    country: getField(source, 'country') || '',
    phone: getField(source, 'phone'),
    isDefault: asBoolean(getField(source, 'isDefault', 'is_default')),
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
  };
};

export const normalizeCartItem = (raw: unknown): CartItem => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    userId: getField(source, 'userId', 'user_id'),
    productId: getField(source, 'productId', 'product_id') || '',
    quantity: asNumber(getField(source, 'quantity'), 1),
    addedAt: getField(source, 'addedAt', 'added_at'),
    totalPrice: asNumber(getField(source, 'totalPrice', 'total_price')),
    product: normalizeProduct(getField(source, 'product') || {}),
  };
};

export const normalizeCart = (raw: unknown): CartResponse => {
  const source = getObject(raw);
  const items = asArray(getField(source, 'items')).map(normalizeCartItem);
  return {
    items,
    totalItems: asNumber(getField(source, 'totalItems', 'total_items'), items.length),
    totalAmount: asNumber(getField(source, 'totalAmount', 'total_amount')),
  };
};

export const normalizeWishlistItem = (raw: unknown): WishlistItem => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    userId: getField(source, 'userId', 'user_id'),
    productId: getField(source, 'productId', 'product_id') || '',
    createdAt: getField(source, 'createdAt', 'created_at'),
    product: normalizeProduct(getField(source, 'product') || {}),
  };
};

export const normalizeCoupon = (raw: unknown): Coupon => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    code: getField(source, 'code') || '',
    description: getField(source, 'description') || null,
    type: getField(source, 'type') || 'percentage',
    value: asNumber(getField(source, 'value')),
    minOrderAmount: getField(source, 'minOrderAmount', 'min_order_amount') !== undefined
      ? asNumber(getField(source, 'minOrderAmount', 'min_order_amount'))
      : null,
    maxDiscountAmount: getField(source, 'maxDiscountAmount', 'max_discount_amount') !== undefined
      ? asNumber(getField(source, 'maxDiscountAmount', 'max_discount_amount'))
      : null,
    usageLimit: getField(source, 'usageLimit', 'usage_limit') !== undefined
      ? asNumber(getField(source, 'usageLimit', 'usage_limit'))
      : null,
    usedCount: asNumber(getField(source, 'usedCount', 'used_count')),
    isActive: asBoolean(getField(source, 'isActive', 'is_active'), true),
    isSingleUsePerUser: asBoolean(
      getField(source, 'isSingleUsePerUser', 'is_single_use_per_user'),
      true,
    ),
    isForNewCustomers: asBoolean(
      getField(source, 'isForNewCustomers', 'is_for_new_customers'),
      false,
    ),
    allowedCategoryIds: asArray<string>(
      getField(source, 'allowedCategoryIds', 'allowed_category_ids'),
    ).filter(Boolean),
    allowedProductIds: asArray<string>(
      getField(source, 'allowedProductIds', 'allowed_product_ids'),
    ).filter(Boolean),
    startsAt: getField(source, 'startsAt', 'starts_at') || null,
    expiresAt: getField(source, 'expiresAt', 'expires_at') || null,
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
  };
};

export const normalizeCouponValidationResult = (raw: unknown): CouponValidationResult => {
  const source = getObject(raw);
  return {
    couponId: getField(source, 'couponId', 'coupon_id') || '',
    code: getField(source, 'code') || '',
    description: getField(source, 'description') || null,
    type: getField(source, 'type') || 'percentage',
    value: asNumber(getField(source, 'value')),
    discountAmount: asNumber(getField(source, 'discountAmount', 'discount_amount')),
    minOrderAmount: getField(source, 'minOrderAmount', 'min_order_amount') !== undefined
      ? asNumber(getField(source, 'minOrderAmount', 'min_order_amount'))
      : null,
    maxDiscountAmount: getField(source, 'maxDiscountAmount', 'max_discount_amount') !== undefined
      ? asNumber(getField(source, 'maxDiscountAmount', 'max_discount_amount'))
      : null,
    usageLimit: getField(source, 'usageLimit', 'usage_limit') !== undefined
      ? asNumber(getField(source, 'usageLimit', 'usage_limit'))
      : null,
    usedCount: asNumber(getField(source, 'usedCount', 'used_count')),
    isSingleUsePerUser: asBoolean(
      getField(source, 'isSingleUsePerUser', 'is_single_use_per_user'),
      true,
    ),
    isForNewCustomers: asBoolean(
      getField(source, 'isForNewCustomers', 'is_for_new_customers'),
      false,
    ),
    allowedCategoryIds: asArray<string>(
      getField(source, 'allowedCategoryIds', 'allowed_category_ids'),
    ).filter(Boolean),
    allowedProductIds: asArray<string>(
      getField(source, 'allowedProductIds', 'allowed_product_ids'),
    ).filter(Boolean),
  };
};

export const normalizeOrderItem = (raw: unknown): OrderItem => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    orderId: getField(source, 'orderId', 'order_id'),
    productId: getField(source, 'productId', 'product_id') || '',
    quantity: asNumber(getField(source, 'quantity'), 1),
    priceAtPurchase: asNumber(getField(source, 'priceAtPurchase', 'price_at_purchase')),
    product: getField(source, 'product') ? normalizeProduct(getField(source, 'product')) : undefined,
    createdAt: getField(source, 'createdAt', 'created_at'),
  };
};

export const normalizePayment = (raw: unknown): Payment => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    orderId: getField(source, 'orderId', 'order_id'),
    paymentMethod: getField(source, 'paymentMethod', 'payment_method') || 'mvola',
    transactionId: getField(source, 'transactionId', 'transaction_id'),
    payerPhone: getField(source, 'payerPhone', 'payer_phone') || null,
    proofImageUrl: getField(source, 'proofImageUrl', 'proof_image_url') || null,
    amount: asNumber(getField(source, 'amount')),
    status: getField(source, 'status') || 'pending',
    paymentDate: getField(source, 'paymentDate', 'payment_date') || null,
    createdAt: getField(source, 'createdAt', 'created_at'),
  };
};

export const normalizePaymentRecord = (raw: unknown): PaymentRecord => {
  const source = getObject(raw);
  const order = getField(source, 'order')
    ? normalizeOrder(getField(source, 'order'))
    : null;

  return {
    ...normalizePayment(source),
    order,
    user: order?.user || null,
  };
};

export const normalizeOrder = (raw: unknown): Order => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    userId: getField(source, 'userId', 'user_id'),
    addressId: getField(source, 'addressId', 'address_id'),
    orderNumber: getField(source, 'orderNumber', 'order_number') || '',
    status: getField(source, 'status') || 'pending',
    subtotal: asNumber(getField(source, 'subtotal')),
    shippingFee: asNumber(getField(source, 'shippingFee', 'shipping_fee')),
    discountAmount: asNumber(getField(source, 'discountAmount', 'discount_amount')),
    totalAmount: asNumber(getField(source, 'totalAmount', 'total_amount')),
    couponCode: getField(source, 'couponCode', 'coupon_code') || null,
    notes: getField(source, 'notes'),
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
    address: getField(source, 'address') ? normalizeAddress(getField(source, 'address')) : null,
    orderItems: asArray(getField(source, 'orderItems', 'order_items')).map(normalizeOrderItem),
    payments: asArray(getField(source, 'payments')).map(normalizePayment),
    user: normalizeUser(getField(source, 'user')),
  };
};

export const normalizeReview = (raw: unknown): Review => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    productId: getField(source, 'productId', 'product_id') || '',
    userId: getField(source, 'userId', 'user_id') || '',
    orderId: getField(source, 'orderId', 'order_id'),
    rating: asNumber(getField(source, 'rating')),
    comment: getField(source, 'comment'),
    moderationStatus: getField(source, 'moderationStatus', 'moderation_status') || 'pending',
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
    user: normalizeUser(getField(source, 'user')),
    product: getField(source, 'product') ? normalizeProduct(getField(source, 'product')) : null,
  };
};

export const normalizeReturnRequest = (raw: unknown): ReturnRequest => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    orderId: getField(source, 'orderId', 'order_id') || '',
    userId: getField(source, 'userId', 'user_id') || '',
    reason: getField(source, 'reason') || '',
    status: getField(source, 'status') || 'requested',
    requestedAt: getField(source, 'requestedAt', 'requested_at'),
    resolvedAt: getField(source, 'resolvedAt', 'resolved_at') || null,
    createdAt: getField(source, 'createdAt', 'created_at'),
    order: getField(source, 'order') ? normalizeOrder(getField(source, 'order')) : null,
    user: normalizeUser(getField(source, 'user')),
  };
};

export const normalizeUserSummary = (raw: unknown): UserSummary => {
  const source = getObject(raw);
  const profile = normalizeProfile(getField(source, 'profile'));
  return {
    id: getField(source, 'id') || '',
    email: getField(source, 'email') || '',
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
    role: getField(source, 'role'),
    profile,
  };
};

export const normalizeAdminLog = (raw: unknown): AdminLog => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    adminId: getField(source, 'adminId', 'admin_id') || '',
    action: getField(source, 'action') || '',
    details: getObject(getField(source, 'details')),
    createdAt: getField(source, 'createdAt', 'created_at'),
    admin: normalizeUser(getField(source, 'admin')),
  };
};

export const normalizeSubscriber = (raw: unknown): Subscriber => {
  const source = getObject(raw);
  return {
    id: getField(source, 'id') || '',
    email: getField(source, 'email') || '',
    isActive: asBoolean(getField(source, 'isActive', 'is_active'), true),
    source: getField(source, 'source') || null,
    createdAt: getField(source, 'createdAt', 'created_at'),
    updatedAt: getField(source, 'updatedAt', 'updated_at'),
  };
};

export const normalizePaymentSummary = (raw: unknown): PaymentSummary => {
  const source = getObject(raw);
  return {
    totalPayments: asNumber(getField(source, 'totalPayments', 'total_payments')),
    completedRevenue: asNumber(getField(source, 'completedRevenue', 'completed_revenue')),
    pendingAmount: asNumber(getField(source, 'pendingAmount', 'pending_amount')),
    pendingCount: asNumber(getField(source, 'pendingCount', 'pending_count')),
    completedCount: asNumber(getField(source, 'completedCount', 'completed_count')),
    failedCount: asNumber(getField(source, 'failedCount', 'failed_count')),
    refundedCount: asNumber(getField(source, 'refundedCount', 'refunded_count')),
    byMethod: {
      mvola: asNumber(getField(getObject(getField(source, 'byMethod', 'by_method')), 'mvola')),
      airtelMoney: asNumber(getField(getObject(getField(source, 'byMethod', 'by_method')), 'airtelMoney', 'airtel_money')),
      orangeMoney: asNumber(getField(getObject(getField(source, 'byMethod', 'by_method')), 'orangeMoney', 'orange_money')),
    },
  };
};

export const normalizeAdminStats = (raw: unknown): AdminStats => {
  const source = getObject(raw);
  return {
    totalUsers: asNumber(getField(source, 'totalUsers', 'total_users')),
    totalProducts: asNumber(getField(source, 'totalProducts', 'total_products')),
    totalOrders: asNumber(getField(source, 'totalOrders', 'total_orders')),
    totalRevenue: asNumber(getField(source, 'totalRevenue', 'total_revenue')),
    lowStockProducts: asNumber(getField(source, 'lowStockProducts', 'low_stock_products')),
    pendingReviews: asNumber(getField(source, 'pendingReviews', 'pending_reviews')),
    pendingReturns: asNumber(getField(source, 'pendingReturns', 'pending_returns')),
    recentOrders: asArray(getField(source, 'recentOrders', 'recent_orders')).map(normalizeOrder),
    paymentsOverview: getField(source, 'paymentsOverview', 'payments_overview')
      ? normalizePaymentSummary(getField(source, 'paymentsOverview', 'payments_overview'))
      : undefined,
  };
};

const normalizeAnalyticsSeriesPoint = (raw: unknown): AnalyticsSeriesPoint => {
  const source = getObject(raw);
  return {
    date: getField(source, 'date') || '',
    orders: asNumber(getField(source, 'orders')),
    paidOrders: asNumber(getField(source, 'paidOrders', 'paid_orders')),
    revenue: asNumber(getField(source, 'revenue')),
    payments: asNumber(getField(source, 'payments')),
    amount: asNumber(getField(source, 'amount')),
    newUsers: asNumber(getField(source, 'newUsers', 'new_users')),
  };
};

const normalizeStatusBreakdownItem = (raw: unknown): StatusBreakdownItem => {
  const source = getObject(raw);
  return {
    status: getField(source, 'status') || '',
    count: asNumber(getField(source, 'count')),
    amount: getField(source, 'amount') !== undefined ? asNumber(getField(source, 'amount')) : undefined,
  };
};

const normalizePaymentMethodBreakdownItem = (raw: unknown): PaymentMethodBreakdownItem => {
  const source = getObject(raw);
  return {
    method: getField(source, 'method') || '',
    count: asNumber(getField(source, 'count')),
    amount: asNumber(getField(source, 'amount')),
  };
};

const normalizeTopProductAnalyticsItem = (raw: unknown): TopProductAnalyticsItem => {
  const source = getObject(raw);
  return {
    productId: getField(source, 'productId', 'product_id') || '',
    name: getField(source, 'name') || '',
    quantitySold: asNumber(getField(source, 'quantitySold', 'quantity_sold')),
    revenue: asNumber(getField(source, 'revenue')),
    orderCount: asNumber(getField(source, 'orderCount', 'order_count')),
    stock: asNumber(getField(source, 'stock')),
  };
};

const normalizeCategoryPerformanceItem = (raw: unknown): CategoryPerformanceItem => {
  const source = getObject(raw);
  return {
    categoryId: getField(source, 'categoryId', 'category_id') || '',
    name: getField(source, 'name') || '',
    quantitySold: asNumber(getField(source, 'quantitySold', 'quantity_sold')),
    revenue: asNumber(getField(source, 'revenue')),
  };
};

const normalizeTopArticleAnalyticsItem = (raw: unknown): TopArticleAnalyticsItem => {
  const source = getObject(raw);
  return {
    articleId: getField(source, 'articleId', 'article_id') || '',
    slug: getField(source, 'slug') || '',
    title: getField(source, 'title') || '',
    likeCount: asNumber(getField(source, 'likeCount', 'like_count')),
    commentCount: asNumber(getField(source, 'commentCount', 'comment_count')),
    score: asNumber(getField(source, 'score')),
    publishedAt: getField(source, 'publishedAt', 'published_at') || null,
  };
};

export const normalizeAdminAnalytics = (raw: unknown): AdminAnalytics => {
  const source = getObject(raw);
  return {
    periodDays: asNumber(getField(source, 'periodDays', 'period_days'), 30),
    generatedAt: getField(source, 'generatedAt', 'generated_at') || new Date(0).toISOString(),
    overview: {
      averageOrderValue: asNumber(getField(getObject(getField(source, 'overview')), 'averageOrderValue', 'average_order_value')),
      repeatCustomers: asNumber(getField(getObject(getField(source, 'overview')), 'repeatCustomers', 'repeat_customers')),
      activeSubscribers: asNumber(getField(getObject(getField(source, 'overview')), 'activeSubscribers', 'active_subscribers')),
      publishedArticles: asNumber(getField(getObject(getField(source, 'overview')), 'publishedArticles', 'published_articles')),
      approvedComments: asNumber(getField(getObject(getField(source, 'overview')), 'approvedComments', 'approved_comments')),
      articleLikes: asNumber(getField(getObject(getField(source, 'overview')), 'articleLikes', 'article_likes')),
      newUsers: asNumber(getField(getObject(getField(source, 'overview')), 'newUsers', 'new_users')),
    },
    salesTimeline: asArray(getField(source, 'salesTimeline', 'sales_timeline')).map(normalizeAnalyticsSeriesPoint),
    paymentTimeline: asArray(getField(source, 'paymentTimeline', 'payment_timeline')).map(normalizeAnalyticsSeriesPoint),
    customerGrowth: asArray(getField(source, 'customerGrowth', 'customer_growth')).map(normalizeAnalyticsSeriesPoint),
    orderStatusBreakdown: asArray(getField(source, 'orderStatusBreakdown', 'order_status_breakdown')).map(normalizeStatusBreakdownItem),
    paymentStatusBreakdown: asArray(getField(source, 'paymentStatusBreakdown', 'payment_status_breakdown')).map(normalizeStatusBreakdownItem),
    paymentMethodBreakdown: asArray(getField(source, 'paymentMethodBreakdown', 'payment_method_breakdown')).map(normalizePaymentMethodBreakdownItem),
    topProducts: asArray(getField(source, 'topProducts', 'top_products')).map(normalizeTopProductAnalyticsItem),
    categoryPerformance: asArray(getField(source, 'categoryPerformance', 'category_performance')).map(normalizeCategoryPerformanceItem),
    topArticles: asArray(getField(source, 'topArticles', 'top_articles')).map(normalizeTopArticleAnalyticsItem),
  };
};

export const normalizeList = <T>(raw: unknown, mapper: (item: unknown) => T): ListResponse<T> => {
  const source = getObject(raw);
  const rawData = Array.isArray(raw)
    ? raw
    : Array.isArray(source.data)
      ? source.data
      : Array.isArray(source.items)
        ? source.items
        : [];

  return {
    data: rawData.map(mapper),
    meta: source.meta || { ...defaultMeta, totalItems: rawData.length, totalPages: rawData.length ? 1 : 0 },
  };
};
