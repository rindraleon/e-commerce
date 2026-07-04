# E-Shop Backend API Documentation

This document outlines all available API endpoints for connecting the frontend with the backend for each entity in the e-shop application.

## Authentication Endpoints

### Register a new user
- **POST** `/auth/signup`
- Request body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```
- Response:
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Sign in user
- **POST** `/auth/signin`
- Request body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- Response:
```json
{
  "message": "Sign in successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": {...},
    "role": "client"
  }
}
```

### Get user profile
- **GET** `/auth/profile`
- Requires authentication
- Response:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "fullName": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "avatarUrl": "https://example.com/avatar.jpg",
  "role": "client"
}
```

### Update user profile
- **PUT** `/auth/profile`
- Request body:
```json
{
  "full_name": "John Smith",
  "phone": "+1987654321",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

## Products Endpoints

### Get all products
- **GET** `/products`
- Query parameters:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `category_id` - filter by category
  - `search` - search term
  - `min_price`, `max_price` - price range
  - `in_stock` - in stock only
  - `featured` - featured products
  - `new` - new products

### Get product by ID
- **GET** `/products/{id}`

### Create product
- **POST** `/products`
- Requires admin role
- Request body:
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "stock": 10,
  "categoryId": "category-id"
}
```

### Update product
- **PUT** `/products/{id}`
- Requires admin role
- Request body:
```json
{
  "name": "Updated Product Name",
  "price": 89.99,
  "stock": 15
}
```

### Delete product
- **DELETE** `/products/{id}`
- Requires admin role

### Add product images
- **POST** `/products/{productId}/images`
- Request body:
```json
{
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "altText": "Image alt text",
      "isPrimary": true
    }
  ]
}
```

### Remove product image
- **DELETE** `/products/images/{imageId}`

### Get products by category
- **GET** `/products/category/{categoryId}`

## Categories Endpoints

### Get all categories
- **GET** `/categories`

### Get category by ID
- **GET** `/categories/{id}`

### Create category
- **POST** `/categories`
- Requires admin role
- Request body:
```json
{
  "name": "Category Name",
  "description": "Category Description"
}
```

### Update category
- **PUT** `/categories/{id}`
- Requires admin role
- Request body:
```json
{
  "name": "Updated Category Name",
  "description": "Updated Description"
}
```

### Delete category
- **DELETE** `/categories/{id}`
- Requires admin role

## Shopping Cart Endpoints

### Get user's cart
- **GET** `/cart`
- Requires authentication

### Add item to cart
- **POST** `/cart`
- Requires authentication
- Request body:
```json
{
  "productId": "product-id",
  "quantity": 2
}
```

### Update cart item
- **PUT** `/cart/{cartItemId}`
- Requires authentication
- Request body:
```json
{
  "quantity": 3
}
```

### Remove item from cart
- **DELETE** `/cart/{cartItemId}`
- Requires authentication

### Clear cart
- **DELETE** `/cart`
- Requires authentication

### Get cart item count
- **GET** `/cart/count`
- Requires authentication

## Orders Endpoints

### Get user's orders
- **GET** `/orders`
- Requires authentication

### Get order by ID
- **GET** `/orders/{orderId}`
- Requires authentication

### Create order
- **POST** `/orders`
- Requires authentication
- Request body:
```json
{
  "addressId": "address-id",
  "orderItems": [
    {
      "productId": "product-id",
      "quantity": 1
    }
  ],
  "notes": "Delivery instructions"
}
```

### Update order status
- **PUT** `/orders/{orderId}/status`
- Requires admin role
- Request body:
```json
{
  "status": "shipped"
}
```

### Get user order stats
- **GET** `/orders/stats/user`
- Requires authentication

### Get admin order stats
- **GET** `/orders/stats/admin`
- Requires admin role

## Reviews Endpoints

### Get reviews
- **GET** `/reviews`
- Query parameters:
  - `productId` - filter by product
  - `userId` - filter by user

### Get review by ID
- **GET** `/reviews/{reviewId}`

### Create review
- **POST** `/reviews`
- Requires authentication
- Request body:
```json
{
  "productId": "product-id",
  "rating": 5,
  "comment": "Great product!"
}
```

### Update review
- **PUT** `/reviews/{reviewId}`
- Requires authentication (own review) or admin
- Request body:
```json
{
  "rating": 4,
  "comment": "Good but could be better"
}
```

### Delete review
- **DELETE** `/reviews/{reviewId}`
- Requires authentication (own review) or admin

### Update review moderation status
- **PUT** `/reviews/{reviewId}/status`
- Requires admin role
- Request body:
```json
{
  "status": "approved"
}
```

### Get average rating for product
- **GET** `/reviews/product/{productId}/rating`

## Returns Endpoints

### Get returns
- **GET** `/returns`
- For authenticated user or admin

### Get return by ID
- **GET** `/returns/{returnId}`
- Requires authentication (own return) or admin

### Create return
- **POST** `/returns`
- Requires authentication
- Request body:
```json
{
  "orderId": "order-id",
  "reason": "Wrong size"
}
```

### Update return status
- **PUT** `/returns/{returnId}/status`
- Requires admin role
- Request body:
```json
{
  "status": "approved"
}
```

### Delete return
- **DELETE** `/returns/{returnId}`
- Requires authentication (own return) or admin

## Users Endpoints

### Get all users
- **GET** `/users`
- Requires admin role

### Get user by ID
- **GET** `/users/{userId}`
- Requires authentication (own profile) or admin

### Update user role
- **PUT** `/users/{targetUserId}/role`
- Requires admin role
- Request body:
```json
{
  "role": "admin"
}
```

### Get user addresses
- **GET** `/users/{userId}/addresses`
- Requires authentication (own addresses) or admin

### Get address by ID
- **GET** `/users/addresses/{addressId}`
- Requires authentication

### Create user address
- **POST** `/users/{userId}/addresses`
- Requires authentication (own addresses)
- Request body:
```json
{
  "label": "Home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "phone": "+1234567890",
  "isDefault": true
}
```

### Update address
- **PUT** `/users/addresses/{addressId}`
- Requires authentication
- Request body:
```json
{
  "label": "Work",
  "street": "456 Office Ave"
}
```

### Delete address
- **DELETE** `/users/addresses/{addressId}`
- Requires authentication

### Set default address
- **POST** `/users/addresses/{addressId}/set-default`
- Requires authentication

## Admin Endpoints

### Log admin action
- **POST** `/admin/log-action`
- Requires admin role
- Request body:
```json
{
  "action": "CREATE_PRODUCT",
  "details": "Created new product: Widget"
}
```

### Get admin logs
- **GET** `/admin/logs`
- Requires admin role

### Get dashboard statistics
- **GET** `/admin/dashboard-stats`
- Requires admin role

## Health Check Endpoint

### Check API health
- **GET** `/health`

---

## Frontend Integration Examples

### Making API Calls from Frontend

```javascript
// Example: Creating a new product (requires admin authentication)
async function createProduct(productData) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}` // Include JWT token
    },
    body: JSON.stringify(productData)
  });
  
  if (response.ok) {
    const result = await response.json();
    return result;
  } else {
    throw new Error('Failed to create product');
  }
}

// Example: Adding item to cart
async function addToCart(productId, quantity) {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      productId,
      quantity
    })
  });
  
  return response.json();
}

// Example: Getting all products
async function getProducts(filters = {}) {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/products?${queryParams}`);
  return response.json();
}
```

### Error Handling

Most endpoints will return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Internal server error