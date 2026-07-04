const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000';
const API_PREFIX = (import.meta.env.VITE_API_PREFIX as string) || ''; // e.g. '/api' or ''

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = API_BASE.replace(/\/$/, '');
  const prefix = API_PREFIX ? `/${API_PREFIX.replace(/^\/|\/$/g, '')}` : '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${prefix}${p}`;
}

type RequestOpts = {
  skipAuth?: boolean;
  rawResponse?: boolean;
};

async function request<T = any>(path: string, init: RequestInit = {}, opts: RequestOpts = {}): Promise<T> {
  const url = buildUrl(path);
  const token = localStorage.getItem('token') || '';

  const headers = new Headers(init.headers || {});
  // If sending JSON by default
  const contentTypeRequired = !(init.body instanceof FormData) && !(headers.get('Content-Type'));
  if (contentTypeRequired) headers.set('Content-Type', 'application/json');

  if (!opts.skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { credentials: 'include', ...init, headers });

  if (res.status === 401) {
    // central handling
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // global event for app to respond
    try { window.dispatchEvent(new CustomEvent('api:unauthorized')); } catch (e) { }
    // redirect to login (SPA)
    try { window.location.href = '/login'; } catch (e) { }
    throw new Error('Unauthorized');
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  const text = await res.text();
  let payload: any = text;
  try { payload = text ? JSON.parse(text) : null; } catch (e) { /* keep raw text */ }

  if (!res.ok) {
    const message = payload?.message || payload || res.statusText;
    const err: any = new Error(String(message));
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload as T;
}

function toQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) return '';
  const qs = new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
  return qs ? `?${qs}` : '';
}

const get = <T = any>(path: string, opts?: RequestOpts) => request<T>(path, { method: 'GET' }, opts);
const post = <T = any>(path: string, body?: any, opts?: RequestOpts) =>
  request<T>(path, { method: 'POST', body: body instanceof FormData ? (body as any) : JSON.stringify(body) }, opts);
const put = <T = any>(path: string, body?: any, opts?: RequestOpts) =>
  request<T>(path, { method: 'PUT', body: body instanceof FormData ? (body as any) : JSON.stringify(body) }, opts);
const patch = <T = any>(path: string, body?: any, opts?: RequestOpts) =>
  request<T>(path, { method: 'PATCH', body: body instanceof FormData ? (body as any) : JSON.stringify(body) }, opts);
const del = <T = any>(path: string, opts?: RequestOpts) => request<T>(path, { method: 'DELETE' }, opts);

// Resource services (use paths without '/api' by default — adjust VITE_API_PREFIX if your backend expects /api)
export const authService = {
  signin: (data: any) => post('/auth/signin', data),
  signup: (data: any) => post('/auth/signup', data),
  signout: () => post('/auth/signout', null),
  profile: () => get('/auth/profile'),
  updateProfile: (data: any) => put('/auth/profile', data),
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }),
};

export const categoryService = {
  create: (data: any) => post('/categories', data),
  findAll: (params?: Record<string, string | number | boolean>) => {
    const qs = toQuery(params);
    return get(`/categories${qs}`);
  },
  findById: (id: string) => get(`/categories/${id}`),
  update: (id: string, data: any) => put(`/categories/${id}`, data),
  delete: (id: string) => del(`/categories/${id}`),
};

export const productService = {
  create: (data: any) => post('/products', data),
  findAll: (params?: Record<string, string | number | boolean>) => {
    const qs = toQuery(params);
    return get(`/products${qs}`);
  },
  findById: (id: string) => get(`/products/${id}`),
  update: (id: string, data: any) => put(`/products/${id}`, data),
  delete: (id: string) => del(`/products/${id}`),
  addImages: (productId: string, imagesFormData: FormData) => post(`/products/${productId}/images`, imagesFormData),
  removeImage: (imageId: string) => del(`/products/images/${imageId}`),
};

export const cartService = {
  add: (data: any) => post('/cart', { product_id: data.productId, quantity: data.quantity || 1 }),
  findByUserId: (id: string) => get(`/cart`),
  update: (id: string, data: any) => put(`/cart/${id}`, data),
  remove: (id: string) => del(`/cart/${id}`),
  clear: (_userId?: string) => del(`/cart`),
  count: (_userId?: string) => get<number>(`/cart/count`),
};

export const orderService = {
  create: (data: any) => post('/orders', data),
  findByUserId: (_userId?: string) => get(`/orders`),
  findById: (id: string, _userId?: string) => get(`/orders/${id}`),
  updateStatus: (orderId: string, payload: any) => put(`/orders/${orderId}/status`, payload),
};

export const reviewService = {
  create: (data: any) => post('/reviews', data),
  findByProductId: (productId: string) => get(`/reviews${toQuery({ product_id: productId || undefined })}`),
  findByUserId: (_userId?: string) => get(`/reviews`),
  findById: (id: string) => get(`/reviews/${id}`),
  update: (id: string, data: any) => put(`/reviews/${id}`, data),
  updateStatus: (id: string, status: string) => put(`/reviews/${id}/status`, { status }),
  delete: (id: string) => del(`/reviews/${id}`),
};

export const addressService = {
  create: (userId: string, data: any) => post(`/users/${userId}/addresses`, data),
  findByUserId: (userId: string) => get(`/users/${userId}/addresses`),
  findById: (id: string) => get(`/users/addresses/${id}`),
  update: (id: string, data: any) => put(`/users/addresses/${id}`, data),
  delete: (id: string) => del(`/users/addresses/${id}`),
  setDefault: (addressId: string) => post(`/users/addresses/${addressId}/set-default`, {}),
};

export const adminLogService = {
  findAll: () => get('/admin/logs'),
  create: (data: any) => post('/admin/log-action', data),
};

export const userService = {
  findAll: () => get('/users'),
  updateRole: (userId: string, role: string) => patch(`/users/${userId}/role`, { role }),
};

export const adminService = {
  getStats: () => get('/admin/dashboard-stats'),
  getRecentOrders: (_limit = 5) => get(`/orders`),
  getLogs: (_limit = 100) => get(`/admin/logs`),
};

export const returnsService = {
  findAll: () => get('/returns'),
  updateStatus: (id: string, status: string) => put(`/returns/${id}/status`, { status }),
};

// Shared Order type used by CheckoutPage and others
export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  addressId: string;
};

// Barrel export
const apiService = {
  request,
  get,
  post,
  put,
  patch,
  del,
  auth: authService,
  categories: categoryService,
  products: productService,
  cart: cartService,
  orders: orderService,
  reviews: reviewService,
  addresses: addressService,
  adminLogs: adminLogService,
  users: userService,
  admin: adminService,
  returns: returnsService,
};

export default apiService;
