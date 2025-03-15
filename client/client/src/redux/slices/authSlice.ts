import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { authAPI } from '../../services/api';
import { resetCart } from './cartSlice';
import { clearFavorites } from './favoritesSlice';
import { fetchCart } from './cartSlice';
import { fetchFavorites } from './favoritesSlice';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface UpdateProfileData {
  name: string;
  currentPassword?: string;
  newPassword?: string;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const register = createAsyncThunk(
  'auth/register',
  async (userData: { name: string; email: string; password: string }) => {
    const response = await authAPI.register(userData);
    return response.data;
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { dispatch }) => {
    const response = await authAPI.login(credentials);
    const { token, user } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // After successful login, fetch cart and favorites
    await dispatch(fetchCart());
    await dispatch(fetchFavorites());
    
    return response.data;
  }
);

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (credentials: { email: string; password: string }, { dispatch }) => {
    try {
      const response = await authAPI.adminLogin(credentials.email, credentials.password);
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Create a normalized user object
      const userData: User = {
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'user'
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // After successful login, fetch cart and favorites
      dispatch(fetchCart());
      dispatch(fetchFavorites());
      
      return { token, user: userData };
    } catch (error: any) {
      console.error('Admin login error:', error);
      throw error;
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (token: string, { dispatch }) => {
    const response = await authAPI.googleLogin(token);
    const { token: authToken, user } = response.data;
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    // After successful login, fetch cart and favorites
    dispatch(fetchCart());
    dispatch(fetchFavorites());
    
    return { token: authToken, user };
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async () => {
    const response = await authAPI.getCurrentUser();
    return response.data.data;
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: UpdateProfileData) => {
    const response = await authAPI.updateProfile(data);
    const updatedUser = response.data;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  await authAPI.logout();
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Clear other slices
  dispatch(resetCart());
  dispatch(clearFavorites());
});

export const initializeAuthState = createAsyncThunk(
  'auth/initializeAuthState',
  async (_, { dispatch }) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Validate token with the server
        await authAPI.getCurrentUser();
        const user = JSON.parse(storedUser);
        return { user, token };
      } catch (error) {
        // If token validation fails, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch(resetCart());
        dispatch(clearFavorites());
        throw error;
      }
    }
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Admin login failed';
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Google login failed';
      })
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user';
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
      })
      .addCase(initializeAuthState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuthState.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
        state.loading = false;
      })
      .addCase(initializeAuthState.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearAuthState } = authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'admin';

export default authSlice.reducer;