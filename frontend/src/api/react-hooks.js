import { useState, useEffect } from 'react';

// Custom hook for E-Shop API
export const useEshopApi = (baseUrl = 'http://localhost:3000') => {
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get headers with auth token
  const getHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  };

  // Handle API response
  const handleResponse = async (response) => {
    try {
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : (data.message || 'Request failed')
      };
    } catch (e) {
      return {
        success: response.ok,
        data: response.ok ? await response.text() : undefined,
        error: response.ok ? undefined : 'Failed to parse response'
      };
    }
  };

  // Set loading and error states
  const executeRequest = async (requestFn) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      return { success: false, error: err.message || 'An error occurred' };
    } finally {
      setLoading(false);
    }
  };

  // AUTHENTICATION METHODS
  // ---------------------

  const register = async (userData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    });
  };

  const login = async (credentials) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/auth/signin`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(credentials),
      });
      const result = await handleResponse(response);
      
      if (result.success) {
        // Optionally store token in localStorage or state
        // localStorage.setItem('token', result.data.token);
      }
      
      return result;
    });
  };

  const getProfile = async () => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/auth/profile`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const updateProfile = async (updateData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });
      return handleResponse(response);
    });
  };

  // PRODUCT METHODS
  // ---------------

  const getProducts = async (page = 1, limit = 10, filters = {}) => {
    return executeRequest(async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${baseUrl}/products?${params}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const getProductById = async (productId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/products/${productId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const createProduct = async (productData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(productData),
      });
      return handleResponse(response);
    });
  };

  const updateProduct = async (productId, updateData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/products/${productId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });
      return handleResponse(response);
    });
  };

  const deleteProduct = async (productId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/products/${productId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  // CATEGORY METHODS
  // ----------------

  const getCategories = async () => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/categories`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const getCategoryById = async (categoryId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/categories/${categoryId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const createCategory = async (categoryData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(categoryData),
      });
      return handleResponse(response);
    });
  };

  const updateCategory = async (categoryId, updateData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/categories/${categoryId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });
      return handleResponse(response);
    });
  };

  const deleteCategory = async (categoryId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  // CART METHODS
  // ------------

  const getCart = async () => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/cart`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const addToCart = async (productId, quantity) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/cart`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      return handleResponse(response);
    });
  };

  const updateCartItem = async (cartItemId, quantity) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ quantity }),
      });
      return handleResponse(response);
    });
  };

  const removeFromCart = async (cartItemId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const clearCart = async () => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/cart`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const getCartItemCount = async () => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/cart/count`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  // ORDER METHODS
  // -------------

  const getOrders = async () => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const getOrderById = async (orderId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const createOrder = async (orderData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(orderData),
      });
      return handleResponse(response);
    });
  };

  // REVIEW METHODS
  // --------------

  const getReviews = async (productId, userId) => {
    return executeRequest(async () => {
      const params = new URLSearchParams();
      if (productId) params.append('productId', productId);
      if (userId) params.append('userId', userId);

      const response = await fetch(`${baseUrl}/reviews${params.toString() ? '?' + params.toString() : ''}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const getReviewById = async (reviewId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/reviews/${reviewId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const createReview = async (reviewData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/reviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reviewData),
      });
      return handleResponse(response);
    });
  };

  const updateReview = async (reviewId, updateData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });
      return handleResponse(response);
    });
  };

  const deleteReview = async (reviewId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  // ADDRESS METHODS
  // ---------------

  const getAddresses = async (userId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/users/${userId}/addresses`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const getAddressById = async (addressId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/users/addresses/${addressId}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const createAddress = async (userId, addressData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/users/${userId}/addresses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(addressData),
      });
      return handleResponse(response);
    });
  };

  const updateAddress = async (addressId, updateData) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/users/addresses/${addressId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });
      return handleResponse(response);
    });
  };

  const deleteAddress = async (addressId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/users/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  const setDefaultAddress = async (addressId) => {
    return executeRequest(async () => {
      const response = await fetch(`${baseUrl}/users/addresses/${addressId}/set-default`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    });
  };

  return {
    // State
    loading,
    error,
    authToken,
    
    // Auth methods
    register,
    login,
    getProfile,
    updateProfile,
    setAuthToken,
    
    // Product methods
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    
    // Category methods
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Cart methods
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemCount,
    
    // Order methods
    getOrders,
    getOrderById,
    createOrder,
    
    // Review methods
    getReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
    
    // Address methods
    getAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
};

// Example component using the hook
export const ProductList = () => {
  const {
    loading,
    error,
    getProducts,
    getCategories
  } = useEshopApi();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      // Get categories
      const categoriesResult = await getCategories();
      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }

      // Get products
      const productsResult = await getProducts(page, 10, selectedCategory ? { category_id: selectedCategory } : {});
      if (productsResult.success) {
        setProducts(productsResult.data);
      }
    };

    fetchData();
  }, [page, selectedCategory]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Products</h2>
      
      <select 
        value={selectedCategory} 
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>${product.price}</p>
            <p>Stock: {product.stock}</p>
          </div>
        ))}
      </div>
      
      <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span>Page {page}</span>
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
};