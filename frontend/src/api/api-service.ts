import { env } from '@/config/env';
import {
  Address,
  AdminAnalytics,
  AdminLog,
  AdminStats,
  Article,
  ArticleComment,
  ArticleEngagement,
  AuthUser,
  CartResponse,
  Category,
  Coupon,
  CouponValidationResult,
  ListResponse,
  Order,
  PaymentRecord,
  PaymentSummary,
  Product,
  ReturnRequest,
  Review,
  Subscriber,
  UserProfile,
  UserSummary,
  WishlistItem,
} from '@/types/domain';
import {
  normalizeAddress,
  normalizeAdminAnalytics,
  normalizeAdminLog,
  normalizeAdminStats,
  normalizeArticle,
  normalizeArticleComment,
  normalizeArticleEngagement,
  normalizeCart,
  normalizeCategory,
  normalizeCoupon,
  normalizeCouponValidationResult,
  normalizeList,
  normalizeOrder,
  normalizePaymentRecord,
  normalizePaymentSummary,
  normalizeProduct,
  normalizeReturnRequest,
  normalizeReview,
  normalizeSubscriber,
  normalizeUser,
  normalizeUserSummary,
  normalizeWishlistItem,
} from '@/utils/api-mappers';

const API_BASE = env.apiBaseUrl;
const API_PREFIX = env.apiPrefix;

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = API_BASE.replace(/\/$/, '');
  const prefix = API_PREFIX ? `/${API_PREFIX.replace(/^\/|\/$/g, '')}` : '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${prefix}${p}`;
}

type RequestOpts = {
  skipAuth?: boolean;
};

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T = unknown>(path: string, init: RequestInit = {}, opts: RequestOpts = {}): Promise<T> {
  const url = buildUrl(path);
  const token = localStorage.getItem('token') || '';

  const headers = new Headers(init.headers || {});
  const isFormData = init.body instanceof FormData;
  if (!isFormData && !headers.get('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!opts.skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: any = text;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    // keep text payload
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('api:unauthorized'));
    throw new ApiError(payload?.message || 'Unauthorized', 401, payload);
  }

  if (!response.ok) {
    throw new ApiError(payload?.message || payload || response.statusText, response.status, payload?.details || payload);
  }

  return payload as T;
}

function toQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return '';
  return `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()}`;
}

const get = <T = unknown>(path: string, opts?: RequestOpts) => request<T>(path, { method: 'GET' }, opts);
const post = <T = unknown>(path: string, body?: any, opts?: RequestOpts) =>
  request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }, opts);
const put = <T = unknown>(path: string, body?: any, opts?: RequestOpts) =>
  request<T>(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }, opts);
const patch = <T = unknown>(path: string, body?: any, opts?: RequestOpts) =>
  request<T>(path, { method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }, opts);
const del = <T = unknown>(path: string, opts?: RequestOpts) => request<T>(path, { method: 'DELETE' }, opts);

async function downloadFile(path: string, filename: string) {
  const url = buildUrl(path);
  const token = localStorage.getItem('token') || '';
  const headers = new Headers();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new ApiError(response.statusText || 'File download failed', response.status);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

const authService = {
  async signin(data: { email: string; password: string }) {
    const result = await post<any>('/auth/signin', data, { skipAuth: true });
    return {
      ...result,
      user: normalizeUser(result?.user) as AuthUser,
    };
  },
  async signup(data: { email: string; password: string; fullName: string; phone?: string }) {
    const result = await post<any>('/auth/signup', data, { skipAuth: true });
    return {
      ...result,
      user: normalizeUser(result?.user) as AuthUser,
    };
  },
  signout: () => post('/auth/signout'),
  async profile() {
    const result = await get<any>('/auth/profile');
    return {
      id: result?.id,
      email: result?.email,
      role: result?.role,
      profile: result?.profile,
    } as { id: string; email: string; role?: string; profile?: UserProfile | null };
  },
  async updateProfile(data: { fullName?: string; phone?: string; avatarUrl?: string }) {
    const payload = {
      full_name: data.fullName,
      phone: data.phone,
      avatar_url: data.avatarUrl,
    };
    const result = await put<any>('/auth/profile', payload);
    return {
      ...result,
      profile: result?.profile,
    };
  },
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }, { skipAuth: true }),
  resetPassword: (token: string, password: string) =>
    post('/auth/reset-password', { token, password }, { skipAuth: true }),
};

const categoryService = {
  async create(data: Partial<Category>) {
    return normalizeCategory(
      await post('/categories', {
        name: data.name,
        name_en: data.nameEn,
        description: data.description,
        description_en: data.descriptionEn,
        icon: data.icon,
        image_url: data.imageUrl,
      }),
    );
  },
  async findAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<Category>(await get(`/categories${toQuery(params)}`), normalizeCategory);
  },
  async findById(id: string) {
    return normalizeCategory(await get(`/categories/${id}`));
  },
  async update(id: string, data: Partial<Category>) {
    return normalizeCategory(
      await put(`/categories/${id}`, {
        name: data.name,
        name_en: data.nameEn,
        description: data.description,
        description_en: data.descriptionEn,
        icon: data.icon,
        image_url: data.imageUrl,
      }),
    );
  },
  delete: (id: string) => del(`/categories/${id}`),
};

type ArticleMutationPayload = Partial<Article> & {
  coverImageFile?: File | null;
};

function buildArticleFormData(data: ArticleMutationPayload) {
  const formData = new FormData();
  if (data.title !== undefined) formData.append('title', data.title);
  if (data.titleEn !== undefined) formData.append('title_en', data.titleEn || '');
  if (data.category !== undefined) formData.append('category', data.category || '');
  if (data.tags !== undefined) {
    formData.append('tags', Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags));
  }
  if (data.excerpt !== undefined) formData.append('excerpt', data.excerpt || '');
  if (data.excerptEn !== undefined) formData.append('excerpt_en', data.excerptEn || '');
  if (data.content !== undefined) formData.append('content', data.content);
  if (data.contentEn !== undefined) formData.append('content_en', data.contentEn || '');
  if (data.isPublished !== undefined) {
    formData.append('is_published', String(Boolean(data.isPublished)));
  }
  if (data.coverImageFile) {
    formData.append('cover_image', data.coverImageFile);
  }
  return formData;
}

const articleService = {
  async findAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<Article>(
      await get(`/articles${toQuery(params)}`),
      normalizeArticle,
    );
  },
  async findAdminAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<Article>(
      await get(`/articles/admin/all${toQuery(params)}`),
      normalizeArticle,
    );
  },
  async findBySlug(slug: string) {
    return normalizeArticle(await get(`/articles/${slug}`));
  },
  async findById(id: string) {
    return normalizeArticle(await get(`/articles/id/${id}`));
  },
  async findComments(slug: string, params?: Record<string, string | number | boolean>) {
    return normalizeList<ArticleComment>(
      await get(`/articles/${slug}/comments${toQuery(params)}`),
      normalizeArticleComment,
    );
  },
  async getEngagement(slug: string) {
    return normalizeArticleEngagement(await get(`/articles/${slug}/engagement`));
  },
  addComment: (slug: string, content: string) =>
    post(`/articles/${slug}/comments`, { content }),
  toggleLike: (slug: string) => post(`/articles/${slug}/like`, {}),
  async create(data: ArticleMutationPayload) {
    return normalizeArticle(await post('/articles', buildArticleFormData(data)));
  },
  async update(id: string, data: ArticleMutationPayload) {
    return normalizeArticle(
      await put(`/articles/${id}`, buildArticleFormData(data)),
    );
  },
  delete: (id: string) => del(`/articles/${id}`),
};

type ProductMutationPayload = Partial<Product> & {
  imageFiles?: File[];
};

function buildProductFormData(data: ProductMutationPayload) {
  const formData = new FormData();
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.nameEn !== undefined) formData.append('name_en', data.nameEn);
  if (data.description !== undefined) formData.append('description', data.description || '');
  if (data.descriptionEn !== undefined) formData.append('description_en', data.descriptionEn || '');
  if (data.price !== undefined) formData.append('price', String(data.price));
  if (data.stock !== undefined) formData.append('stock', String(data.stock));
  if (data.categoryId) formData.append('category_id', data.categoryId);
  if (data.weightKg !== undefined) formData.append('weight_kg', String(data.weightKg));
  if (data.isFeatured !== undefined) formData.append('is_featured', String(Boolean(data.isFeatured)));
  if (data.isNew !== undefined) formData.append('is_new', String(Boolean(data.isNew)));
  data.imageFiles?.forEach((file) => formData.append('images', file));
  return formData;
}

const productService = {
  async create(data: ProductMutationPayload) {
    if (data.imageFiles?.length) {
      return normalizeProduct(await post('/products/with-files', buildProductFormData(data)));
    }

    return normalizeProduct(
      await post('/products', {
        name: data.name,
        name_en: data.nameEn,
        description: data.description,
        description_en: data.descriptionEn,
        price: data.price,
        stock: data.stock,
        category_id: data.categoryId,
        weight_kg: data.weightKg,
        is_featured: data.isFeatured,
        is_new: data.isNew,
      }),
    );
  },
  async findAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<Product>(await get(`/products${toQuery(params)}`), normalizeProduct);
  },
  async findById(id: string) {
    return normalizeProduct(await get(`/products/${id}`));
  },
  async update(id: string, data: ProductMutationPayload) {
    if (data.imageFiles?.length) {
      return normalizeProduct(await put(`/products/${id}/with-files`, buildProductFormData(data)));
    }

    return normalizeProduct(
      await put(`/products/${id}`, {
        name: data.name,
        name_en: data.nameEn,
        description: data.description,
        description_en: data.descriptionEn,
        price: data.price,
        stock: data.stock,
        category_id: data.categoryId,
        weight_kg: data.weightKg,
        is_featured: data.isFeatured,
        is_new: data.isNew,
      }),
    );
  },
  delete: (id: string) => del(`/products/${id}`),
  addImages: (productId: string, images: { imageUrl: string; isPrimary?: boolean; sortOrder?: number }[]) =>
    post(`/products/${productId}/images`, {
      images: images.map((image) => ({
        image_url: image.imageUrl,
        is_primary: image.isPrimary,
        sort_order: image.sortOrder,
      })),
    }),
  uploadImages: (productId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return post(`/products/${productId}/images/upload`, formData);
  },
  removeImage: (imageId: string) => del(`/products/images/${imageId}`),
};

const cartService = {
  add: (data: { productId: string; quantity?: number }) => post('/cart', { product_id: data.productId, quantity: data.quantity || 1 }),
  async findByUserId() {
    return normalizeCart(await get('/cart'));
  },
  update: (id: string, data: { quantity: number }) => put(`/cart/${id}`, data),
  remove: (id: string) => del(`/cart/${id}`),
  clear: () => del('/cart'),
  async count() {
    const result = await get<{ count: number }>('/cart/count');
    return result?.count || 0;
  },
};

const wishlistService = {
  async findAll() {
    const result = await get<unknown[]>('/wishlist');
    return Array.isArray(result) ? result.map(normalizeWishlistItem) : [];
  },
  add: (productId: string) => post('/wishlist', { product_id: productId }),
  toggle: (productId: string) => post('/wishlist/toggle', { product_id: productId }),
  remove: (productId: string) => del(`/wishlist/${productId}`),
};

const couponService = {
  validate: async (
    code: string,
    subtotal: number,
    items?: Array<{
      productId: string;
      categoryId?: string;
      quantity: number;
      unitPrice: number;
    }>,
  ): Promise<CouponValidationResult> =>
    normalizeCouponValidationResult(
      await post('/coupons/validate', {
        code,
        subtotal,
        items: items?.map((item) => ({
          product_id: item.productId,
          category_id: item.categoryId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      }),
    ),
  async findAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<Coupon>(await get(`/coupons${toQuery(params)}`), normalizeCoupon);
  },
  create: async (data: Partial<Coupon>) =>
    normalizeCoupon(
      await post('/coupons', {
        code: data.code,
        description: data.description,
        type: data.type,
        value: data.value,
        min_order_amount: data.minOrderAmount,
        max_discount_amount: data.maxDiscountAmount,
        usage_limit: data.usageLimit,
        is_active: data.isActive,
        is_single_use_per_user: data.isSingleUsePerUser,
        is_for_new_customers: data.isForNewCustomers,
        allowed_category_ids: data.allowedCategoryIds,
        allowed_product_ids: data.allowedProductIds,
        starts_at: data.startsAt,
        expires_at: data.expiresAt,
      }),
    ),
  update: async (couponId: string, data: Partial<Coupon>) =>
    normalizeCoupon(
      await put(`/coupons/${couponId}`, {
        code: data.code,
        description: data.description,
        type: data.type,
        value: data.value,
        min_order_amount: data.minOrderAmount,
        max_discount_amount: data.maxDiscountAmount,
        usage_limit: data.usageLimit,
        is_active: data.isActive,
        is_single_use_per_user: data.isSingleUsePerUser,
        is_for_new_customers: data.isForNewCustomers,
        allowed_category_ids: data.allowedCategoryIds,
        allowed_product_ids: data.allowedProductIds,
        starts_at: data.startsAt,
        expires_at: data.expiresAt,
      }),
    ),
  delete: (couponId: string) => del(`/coupons/${couponId}`),
};

const orderService = {
  async create(data: {
    addressId: string;
    orderItems: { productId: string; quantity: number }[];
    notes?: string;
    couponCode?: string;
    paymentMethod: string;
    paymentReference: string;
    payerPhone?: string;
    paymentProofFile?: File | null;
  }) {
    if (data.paymentProofFile) {
      const formData = new FormData();
      formData.append('address_id', data.addressId);
      formData.append(
        'items',
        JSON.stringify(
          data.orderItems.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        ),
      );
      formData.append('notes', data.notes || '');
      if (data.couponCode) {
        formData.append('coupon_code', data.couponCode);
      }
      formData.append('payment_method', data.paymentMethod);
      formData.append('payment_reference', data.paymentReference);
      if (data.payerPhone) {
        formData.append('payer_phone', data.payerPhone);
      }
      formData.append('payment_proof', data.paymentProofFile);
      return normalizeOrder(await post('/orders/with-proof', formData));
    }

    return normalizeOrder(
      await post('/orders', {
        address_id: data.addressId,
        items: data.orderItems.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        notes: data.notes,
        coupon_code: data.couponCode,
        payment_method: data.paymentMethod,
        payment_reference: data.paymentReference,
        payer_phone: data.payerPhone,
      }),
    );
  },
  async findByUserId(params?: Record<string, string | number | boolean>) {
    return normalizeList<Order>(await get(`/orders${toQuery(params)}`), normalizeOrder);
  },
  async findById(id: string) {
    return normalizeOrder(await get(`/orders/${id}`));
  },
  updatePayment: async (
    orderId: string,
    payload: {
      paymentMethod?: string;
      paymentReference?: string;
      payerPhone?: string;
      paymentProofFile?: File | null;
    },
  ) => {
    const formData = new FormData();
    if (payload.paymentMethod) formData.append('payment_method', payload.paymentMethod);
    if (payload.paymentReference) formData.append('payment_reference', payload.paymentReference);
    if (payload.payerPhone) formData.append('payer_phone', payload.payerPhone);
    if (payload.paymentProofFile) formData.append('payment_proof', payload.paymentProofFile);
    return normalizeOrder(await patch(`/orders/${orderId}/payment`, formData));
  },
  updateStatus: (orderId: string, payload: { status: string }) => put(`/orders/${orderId}/status`, payload),
  downloadInvoice: (orderId: string) =>
    downloadFile(`/orders/${orderId}/invoice`, `invoice-${orderId}.pdf`),
  getUserStats: () => get('/orders/stats/user'),
  getAdminStats: () => get('/orders/stats/admin'),
};

const reviewService = {
  create: (data: { productId: string; rating: number; comment?: string }) =>
    post('/reviews', { product_id: data.productId, rating: data.rating, comment: data.comment }),
  async findByProductId(productId: string, params?: Record<string, string | number | boolean>) {
    return normalizeList<Review>(await get(`/reviews${toQuery({ product_id: productId, ...params })}`), normalizeReview);
  },
  async findByUserId(params?: Record<string, string | number | boolean>) {
    return normalizeList<Review>(await get(`/reviews${toQuery(params)}`), normalizeReview);
  },
  async findById(id: string) {
    return normalizeReview(await get(`/reviews/${id}`));
  },
  update: (id: string, data: { rating?: number; comment?: string }) => put(`/reviews/${id}`, data),
  updateStatus: (id: string, status: string) => put(`/reviews/${id}/status`, { moderation_status: status }),
  delete: (id: string) => del(`/reviews/${id}`),
};

const addressService = {
  create: (userId: string, data: Partial<Address>) =>
    post(`/users/${userId}/addresses`, {
      label: data.label,
      street: data.street,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      phone: data.phone,
      is_default: data.isDefault,
    }),
  async findByUserId(userId: string) {
    const result = await get<any[]>(`/users/${userId}/addresses`);
    return Array.isArray(result) ? result.map(normalizeAddress) : [];
  },
  async findById(id: string) {
    return normalizeAddress(await get(`/users/addresses/${id}`));
  },
  update: (id: string, data: Partial<Address>) =>
    put(`/users/addresses/${id}`, {
      label: data.label,
      street: data.street,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      phone: data.phone,
      is_default: data.isDefault,
    }),
  delete: (id: string) => del(`/users/addresses/${id}`),
  setDefault: (addressId: string) => post(`/users/addresses/${addressId}/set-default`, {}),
};

const adminLogService = {
  async findAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<AdminLog>(await get(`/admin/logs${toQuery(params)}`), normalizeAdminLog);
  },
  create: (data: { action: string; details?: Record<string, unknown> | string }) => post('/admin/log-action', data),
};

const userService = {
  async findAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<UserSummary>(await get(`/users${toQuery(params)}`), normalizeUserSummary);
  },
  async findById(userId: string) {
    return normalizeUserSummary(await get(`/users/${userId}`));
  },
  updateRole: (userId: string, role: string) => patch(`/users/${userId}/role`, { role }),
};

const adminService = {
  async getStats(): Promise<AdminStats> {
    return normalizeAdminStats(await get('/admin/dashboard-stats'));
  },
  async getAnalytics(days = 30): Promise<AdminAnalytics> {
    return normalizeAdminAnalytics(await get(`/admin/analytics${toQuery({ days })}`));
  },
  async getRecentOrders(limit = 5): Promise<ListResponse<Order>> {
    return normalizeList<Order>(await get(`/orders${toQuery({ page: 1, limit })}`), normalizeOrder);
  },
  async getLogs(limit = 100): Promise<ListResponse<AdminLog>> {
    return normalizeList<AdminLog>(await get(`/admin/logs${toQuery({ page: 1, limit })}`), normalizeAdminLog);
  },
  seedDemo: (reset = true) => post('/admin/demo-seed', { reset }),
  async getPaymentSummary(): Promise<PaymentSummary> {
    return normalizePaymentSummary(await get('/admin/payments/summary'));
  },
  async getPayments(
    params?: Record<string, string | number | boolean>,
  ): Promise<ListResponse<PaymentRecord>> {
    return normalizeList<PaymentRecord>(
      await get(`/admin/payments${toQuery(params)}`),
      normalizePaymentRecord,
    );
  },
  updatePaymentStatus: (paymentId: string, status: string) =>
    patch(`/admin/payments/${paymentId}/status`, { status }),
};

const returnsService = {
  async findAll(params?: Record<string, string | number | boolean>) {
    return normalizeList<ReturnRequest>(await get(`/returns${toQuery(params)}`), normalizeReturnRequest);
  },
  updateStatus: (id: string, status: string) => put(`/returns/${id}/status`, { status }),
  create: (data: { orderId: string; reason: string }) => post('/returns', { order_id: data.orderId, reason: data.reason }),
  delete: (id: string) => del(`/returns/${id}`),
};

const subscriberService = {
  subscribe: (email: string, source = 'website') =>
    post('/subscribers', { email, source }, { skipAuth: true }),
  async findAll() {
    return normalizeList<Subscriber>(await get('/subscribers'), normalizeSubscriber);
  },
  updateStatus: (subscriberId: string, isActive: boolean) =>
    patch(`/subscribers/${subscriberId}/status`, { is_active: isActive }),
  delete: (subscriberId: string) => del(`/subscribers/${subscriberId}`),
};

export type { Order } from '@/types/domain';

const apiService = {
  request,
  get,
  post,
  put,
  patch,
  del,
  auth: authService,
  categories: categoryService,
  articles: articleService,
  products: productService,
  cart: cartService,
  wishlist: wishlistService,
  coupons: couponService,
  orders: orderService,
  reviews: reviewService,
  addresses: addressService,
  adminLogs: adminLogService,
  users: userService,
  admin: adminService,
  returns: returnsService,
  subscribers: subscriberService,
};

export default apiService;
