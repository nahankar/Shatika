import axios, { AxiosError } from 'axios';
import { clearAuthState } from '../redux/slices/authSlice';
import { clearCartState } from '../redux/slices/cartSlice';
import { clearFavorites } from '../redux/slices/favoritesSlice';
import { store } from '../redux/store';

interface UpdateProfileData {
  name: string;
  currentPassword?: string;
  newPassword?: string;
}

interface ApiErrorResponse {
  message: string;
  [key: string]: any;
}

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.DEV 
    ? '/api' 
    : `${import.meta.env.VITE_API_URL || window.location.origin}/api`,
  withCredentials: true,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set headers based on the data type
    if (config.data instanceof FormData) {
      // Remove any content-type header to let the browser set it with boundary
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
      config.headers['Accept'] = 'application/json';
    }
    
    console.log('API Request Details:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data instanceof FormData ? 'FormData' : config.data,
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    console.error('Error Config:', error.config);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('API Response Details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      config: {
        method: response.config.method,
        url: response.config.url,
        baseURL: response.config.baseURL,
      }
    });
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config,
    });
    if (error.response?.status === 401) {
      console.log('Received 401 error, clearing state and redirecting to login');
      
      // Clear all state and localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch actions to clear Redux state
      store.dispatch(clearAuthState());
      store.dispatch(clearCartState());
      store.dispatch(clearFavorites());

      // Force redirect to login after a short delay to allow state to clear
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }

    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(errorMessage);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', credentials),

  register: (userData: { name: string; email: string; password: string }) =>
    axiosInstance.post('/auth/register', userData),

  adminLogin: (email: string, password: string) =>
    axiosInstance.post('/auth/admin/login', { email, password }),

  googleLogin: (token: string) =>
    axiosInstance.post('/auth/google', { token }),

  updateProfile: (data: UpdateProfileData) =>
    axiosInstance.put('/users/profile', data),

  logout: () => axiosInstance.post('/auth/logout'),

  getCurrentUser: () => axiosInstance.get('/auth/me'),
};

// Products API
export const productsAPI = {
  getAll: () => axiosInstance.get('/products'),
  getById: (id: string) => axiosInstance.get(`/products/${id}`),
  create: (productData: FormData) => axiosInstance.post('/products', productData),
  update: (id: string, productData: FormData) => {
    console.log('Updating product:', { id });
    console.log('FormData contents:');
    for (const pair of productData.entries()) {
      console.log(pair[0], pair[1]);
    }
    return axiosInstance.patch(`/products/${id}`, productData);
  },
  delete: (id: string) => axiosInstance.delete(`/products/${id}`),
  toggleFavorite: (id: string) => axiosInstance.post(`/products/${id}/favorite`),
  getAnalytics: () => axiosInstance.get('/products/analytics'),
};

// Users API
export const usersAPI = {
  getAll: () => axiosInstance.get('/users'),
  getOne: (id: string) => axiosInstance.get(`/users/${id}`),
  update: (id: string, data: any) => axiosInstance.put(`/users/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/users/${id}`),
  getProfile: () => axiosInstance.get('/users/profile'),
  updateProfile: (data: any) => axiosInstance.put('/users/profile', data),
  getAnalytics: () => axiosInstance.get('/users/analytics'),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => axiosInstance.get('/favorites'),
  getUserFavorites: (userId: string) => {
    if (!userId) {
      console.error('getUserFavorites called without userId');
      return Promise.reject(new Error('User ID is required'));
    }
    return axiosInstance.get(`/users/${userId}/favorites`);
  },
  add: (productId: string) => axiosInstance.post('/favorites', { productId }),
  remove: (productId: string) => axiosInstance.delete(`/favorites/${productId}`),
};

// Cart API
export const cartAPI = {
  getItems: () => axiosInstance.get('/cart'),
  getUserCart: (userId: string) => {
    if (!userId) {
      console.error('getUserCart called without userId');
      return Promise.reject(new Error('User ID is required'));
    }
    return axiosInstance.get(`/users/${userId}/cart`);
  },
  add: (productId: string, quantity: number, size?: string, color?: string) => {
    console.log('API: Adding to cart:', { productId, quantity, size, color });
    return axiosInstance.post('/cart', { productId, quantity, size, color });
  },
  
  update: (cartItemId: string, quantity: number) => {
    console.log('API: Updating cart item:', { 
      cartItemId, 
      cartItemIdType: typeof cartItemId,
      quantity 
    });
    if (!cartItemId) {
      return Promise.reject(new Error('Cart item ID is required'));
    }
    return axiosInstance.put(`/cart/${cartItemId}`, { quantity });
  },
  
  remove: (cartItemId: string) => {
    console.log('API: Removing cart item:', { 
      cartItemId,
      cartItemIdType: typeof cartItemId
    });
    if (!cartItemId) {
      return Promise.reject(new Error('Cart item ID is required'));
    }
    return axiosInstance.delete(`/cart/${cartItemId}`);
  },
  
  clear: () => axiosInstance.delete('/cart'),
};

export const categoriesAPI = {
  getAll: () => axiosInstance.get('/categories'),
  create: (name: string) => axiosInstance.post('/categories', { name }),
  update: (id: string, name: string) =>
    axiosInstance.put(`/categories/${id}`, { name }),
  delete: (id: string) => axiosInstance.delete(`/categories/${id}`),
};

export const materialsAPI = {
  getAll: () => axiosInstance.get('/materials'),
  getById: (id: string) => axiosInstance.get(`/materials/${id}`),
  create: (name: string) => axiosInstance.post('/materials', { name }),
  update: (id: string, name: string) => axiosInstance.patch(`/materials/${id}`, { name }),
  delete: (id: string) => axiosInstance.delete(`/materials/${id}`),
};

export const artsAPI = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get('/arts');
      console.log('[ArtsAPI] Raw Response:', response);

      // Return the full response to let the component handle the data structure
      return response;
    } catch (error) {
      console.error('[ArtsAPI] Error in getAll:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/arts/${id}`);
      return response;
    } catch (error) {
      console.error('[ArtsAPI] Error fetching art:', error);
      throw error;
    }
  },

  create: async (formData: FormData) => {
    try {
      console.log('[ArtsAPI] Creating art with form data:', 
        Object.fromEntries(formData.entries())
      );
      
      const response = await axiosInstance.post('/arts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response;
    } catch (error) {
      console.error('[ArtsAPI] Error creating art:', error);
      throw error;
    }
  },

  update: async (id: string, formData: FormData) => {
    try {
      console.log('[ArtsAPI] Updating art:', id);
      console.log('[ArtsAPI] Form data:', 
        Object.fromEntries(formData.entries())
      );

      const response = await axiosInstance.patch(`/arts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response;
    } catch (error) {
      console.error('[ArtsAPI] Error updating art:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/arts/${id}`);
      return response;
    } catch (error) {
      console.error('[ArtsAPI] Error deleting art:', error);
      throw error;
    }
  },
};

export const homeSectionsAPI = {
  getAll: () => axiosInstance.get('/home-sections'),
  getById: (id: string) => axiosInstance.get(`/home-sections/${id}`),
  create: (data: any) => axiosInstance.post('/home-sections', data),
  update: (id: string, data: any) => axiosInstance.put(`/home-sections/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/home-sections/${id}`),
};

export const designElementsAPI = {
  getAll: () => axiosInstance.get('/design-elements'),
  getById: (id: string) => axiosInstance.get(`/design-elements/${id}`),
  create: (data: FormData) => axiosInstance.post('/design-elements', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: FormData) => axiosInstance.put(`/design-elements/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => axiosInstance.delete(`/design-elements/${id}`),
  toggleStatus: (id: string, isActive: boolean) => axiosInstance.patch(`/design-elements/${id}/toggle`, { isActive })
};

export const projectsAPI = {
  getAll: () => axiosInstance.get('/projects'),
  getById: (id: string) => axiosInstance.get(`/projects/${id}`),
  create: (data: FormData) => axiosInstance.post('/projects', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, data: FormData) => axiosInstance.patch(`/projects/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id: string) => axiosInstance.delete(`/projects/${id}`),
};

export default axiosInstance;
