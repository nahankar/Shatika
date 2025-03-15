import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import AdminRoute from './components/AdminRoute/AdminRoute';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Container } from '@mui/material';
import { useAppDispatch } from './redux/store';
import { initializeAuthState } from './redux/slices/authSlice';
import { fetchFavorites } from './redux/slices/favoritesSlice';
import { fetchCart } from './redux/slices/cartSlice';
import { RootState } from './redux/store';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await dispatch(initializeAuthState()).unwrap();
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    initAuth();
  }, [dispatch]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && !loading && isInitialized) {
        try {
          await Promise.all([
            dispatch(fetchFavorites()).unwrap(),
            dispatch(fetchCart()).unwrap()
          ]);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // If there's an auth error, the interceptor will handle the redirect
        }
      }
    };
    fetchUserData();
  }, [dispatch, isAuthenticated, loading, isInitialized]);

  // Don't render anything until we've initialized auth
  if (!isInitialized && loading) {
    return null; // Or return a loading spinner
  }

  return (
    <Container maxWidth={false} disableGutters>
      <Navbar />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          width: '100vw',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        <Box 
          component="main" 
          sx={{ 
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflowX: 'hidden'
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Protected Routes */}
            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <Favorites />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard/*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </Box>
      </Box>
    </Container>
  );
}

export default App;
