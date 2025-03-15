import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
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
  baseURL: `${API_BASE_URL}/api/v1`,
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
    
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data instanceof FormData ? 'FormData' : config.data,
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
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
};

// Users API
export const usersAPI = {
  getAll: () => axiosInstance.get('/users'),
  getOne: (id: string) => axiosInstance.get(`/users/${id}`),
  update: (id: string, data: any) => axiosInstance.put(`/users/${id}`, data),
  delete: (id: string) => axiosInstance.delete(`/users/${id}`),
  getProfile: () => axiosInstance.get('/users/profile'),
  updateProfile: (data: any) => axiosInstance.put('/users/profile', data),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => axiosInstance.get('/favorites'),
  add: (productId: string) => axiosInstance.post('/favorites', { productId }),
  remove: (productId: string) => axiosInstance.delete(`/favorites/${productId}`),
};

// Cart API
export const cartAPI = {
  getItems: () => axiosInstance.get('/cart'),
  add: (productId: string, quantity: number, size?: string, color?: string) =>
    axiosInstance.post('/cart', { productId, quantity, size, color }),
  update: (cartItemId: string, quantity: number) => {
    console.log('API: Updating cart item:', { cartItemId, quantity });
    return axiosInstance.put(`/cart/${cartItemId}`, { quantity });
  },
  remove: (cartItemId: string) => {
    console.log('API: Removing cart item:', { cartItemId });
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
  getAll: () => axiosInstance.get('/arts'),
  getById: (id: string) => axiosInstance.get(`/arts/${id}`),
  create: (formData: FormData) => axiosInstance.post('/arts', formData),
  update: (id: string, formData: FormData) => {
    console.log('Updating art:', { id });
    console.log('FormData contents:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    return axiosInstance.patch(`/arts/${id}`, formData);
  },
  delete: (id: string) => axiosInstance.delete(`/arts/${id}`),
};

export const homeSectionsAPI = {
  getAll: () => axiosInstance.get('/home-sections'),
  create: (formData: FormData) => axiosInstance.post('/home-sections', formData),
  update: (id: string, formData: FormData) => {
    console.log('Updating home section:', { id });
    console.log('FormData contents:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    return axiosInstance.patch(`/home-sections/${id}`, formData);
  },
  delete: (id: string) => axiosInstance.delete(`/home-sections/${id}`),
};

export default axiosInstance;
