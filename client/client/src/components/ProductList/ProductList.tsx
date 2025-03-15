import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Grid,
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import ProductCard from '../ProductCard/ProductCard';
import { RootState, useAppDispatch } from '../../redux/store';
import { fetchProducts } from '../../redux/slices/productsSlice';
import { fetchFavorites } from '../../redux/slices/favoritesSlice';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import { Product } from '../../types/product';

interface ProductListProps {
  category?: string;
}

interface ProductsState {
  items: Product[];
  filteredItems: Product[];
  loading: boolean;
  error: string | null;
}

// Memoized selectors
const selectFilteredItems = (state: RootState) => (state.products as ProductsState).filteredItems || [];
const selectLoading = (state: RootState) => (state.products as ProductsState).loading || false;
const selectError = (state: RootState) => (state.products as ProductsState).error || null;

const ProductList = ({ category }: ProductListProps) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const filteredItems = useSelector(selectFilteredItems);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites());
    }
  }, [isAuthenticated, dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!Array.isArray(filteredItems) || filteredItems.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          No products found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Try adjusting your filters or check back later
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={4}>
      {filteredItems.map((product: Product) => (
        <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductList; 