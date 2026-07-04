# Frontend-Backend Connection for E-Shop Application

This directory contains examples and documentation for connecting the frontend with the backend API for all entities in the e-shop application.

## Available Files

### 1. API Service Examples
- **API_SERVICE_EXAMPLE.ts** - TypeScript API service class with methods for all entities
- **API_SERVICE_EXAMPLE.js** - JavaScript API service class (compatible with any frontend framework)

### 2. React Integration
- **REACT_HOOK_EXAMPLE.js** - React custom hook and component example demonstrating API integration

### 3. Documentation
- **../backend/API_DOCUMENTATION.md** - Complete API endpoint documentation

## How to Connect Frontend to Backend

### 1. Using the API Service Class

Import and instantiate the API service:

```javascript
import EShopApiService from './path/to/API_SERVICE_EXAMPLE';

const apiService = new EShopApiService('http://localhost:3000'); // Replace with your backend URL

// Example: Register a new user
const registrationResult = await apiService.register({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe',
  phone: '+1234567890'
});

if (registrationResult.success) {
  console.log('Registration successful:', registrationResult.data);
} else {
  console.error('Registration failed:', registrationResult.error);
}
```

### 2. Setting Authentication Token

After successful login, set the authentication token:

```javascript
// After login
const loginResult = await apiService.login({
  email: 'user@example.com',
  password: 'password123'
});

if (loginResult.success) {
  // Set token for subsequent requests
  apiService.setAuthToken(loginResult.data.token); // Adjust based on your backend response
}
```

### 3. Using the React Hook

Import and use the custom hook:

```javascript
import { useEshopApi } from './path/to/REACT_HOOK_EXAMPLE';

const MyComponent = () => {
  const {
    loading,
    error,
    getProducts,
    addToCart,
    setAuthToken
  } = useEshopApi(); // Optionally pass base URL

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId, 1);
    if (result.success) {
      alert('Added to cart!');
    } else {
      alert('Failed to add to cart: ' + result.error);
    }
  };

  // Component JSX...
};
```

## Supported Entities and Operations

The API service supports operations for all entities:

- **Authentication**: Register, login, profile management
- **Products**: Create, read, update, delete, search, filter
- **Categories**: Create, read, update, delete
- **Shopping Cart**: Add/remove items, update quantities, get cart
- **Orders**: Create, read, update status
- **Reviews**: Create, read, update, delete
- **Addresses**: Create, read, update, delete, set default
- **Users**: Get user info, update roles (admin only)

## Error Handling

All API methods return a standardized response format:

```javascript
{
  success: boolean,
  data?: any, // Response data if successful
  error?: string // Error message if failed
}
```

Example error handling:

```javascript
const result = await apiService.getProducts();

if (result.success) {
  // Process successful response
  const products = result.data;
} else {
  // Handle error
  console.error('Error fetching products:', result.error);
}
```

## Environment Configuration

For production use, configure your backend URL appropriately:

```javascript
// Development
const apiService = new EShopApiService('http://localhost:3000');

// Production
const apiService = new EShopApiService('https://yourdomain.com/api');
```

## Running the Backend

Make sure your backend is running before connecting from the frontend:

```bash
cd backend
npm run start
```

The backend typically runs on `http://localhost:3000`.

## Integration Checklist

- [ ] Backend server is running
- [ ] CORS is configured (if needed)
- [ ] Authentication tokens are properly managed
- [ ] Error handling is implemented
- [ ] Loading states are shown to users
- [ ] All entity operations are tested

For complete API endpoint documentation, see the `API_DOCUMENTATION.md` file in the backend directory.