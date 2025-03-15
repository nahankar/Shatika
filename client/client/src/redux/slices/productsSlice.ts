import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { productsAPI } from '../../services/api';
import { Product } from '../../types/product';
import { RootState } from '../../redux/store';
import { addToFavorites, removeFromFavorites } from './favoritesSlice';

interface ProductsState {
  items: Product[];
  filteredItems: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: {
    categories: string[];
    materials: string[];
    arts: string[];
    priceRange: [number, number] | null;
    tags: string[];
  };
}

const initialState: ProductsState = {
  items: [],
  filteredItems: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: {
    categories: [],
    materials: [],
    arts: [],
    priceRange: null,
    tags: [],
  },
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    const response = await productsAPI.getAll();
    return response.data;
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (productId: string, { getState }) => {
    try {
      const response = await productsAPI.getById(productId);
      const state = getState() as RootState;
      const favorites = state.favorites.items;
      
      // Handle both possible response structures
      const product = response.data.data || response.data;
      
      if (!product) {
        throw new Error('Product not found');
      }

      return {
        ...product,
        images: product.images || [],
        isFavorite: favorites.some(fav => fav._id === product._id)
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (formData: FormData) => {
    const response = await productsAPI.create(formData);
    return response.data;
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, formData }: { id: string; formData: FormData }) => {
    const response = await productsAPI.update(id, formData);
    return response.data;
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string) => {
    await productsAPI.delete(id);
    return id;
  }
);

export const toggleFavorite = createAsyncThunk(
  'products/toggleFavorite',
  async (productId: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const favorites = state.favorites.items;
    const isFavorited = favorites.some(fav => fav._id === productId);

    if (isFavorited) {
      await dispatch(removeFromFavorites(productId)).unwrap();
    } else {
      await dispatch(addToFavorites(productId)).unwrap();
    }

    return { productId, isFavorited: !isFavorited };
  }
);

const applyFilters = (items: Product[], filters: ProductsState['filters']): Product[] => {
  return items.filter((product) => {
    const categoryMatch = filters.categories.length === 0 || 
      filters.categories.includes(typeof product.category === 'object' ? product.category.name : product.category);
    
    const materialMatch = filters.materials.length === 0 ||
      filters.materials.includes(typeof product.material === 'object' ? product.material.name : product.material);
    
    const artMatch = filters.arts.length === 0 ||
      filters.arts.includes(typeof product.art === 'object' ? product.art.name : product.art);
    
    const priceMatch = !filters.priceRange || 
      (product.price >= filters.priceRange[0] && 
       product.price <= filters.priceRange[1]);
    
    const tagsMatch = filters.tags.length === 0 || 
      filters.tags.some(tag => product.tags.includes(tag));
    
    return categoryMatch && materialMatch && artMatch && priceMatch && tagsMatch;
  });
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ProductsState['filters']>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
      state.filteredItems = applyFilters(state.items, state.filters);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both possible response structures
        state.items = action.payload.data || action.payload;
        state.filteredItems = applyFilters(state.items, state.filters);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
        state.items = [];
        state.filteredItems = [];
      })
      // Fetch Single Product
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch product';
        state.selectedProduct = null;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
        state.filteredItems = applyFilters(state.items, state.filters);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create product';
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload.data;
        const index = state.items.findIndex(item => item._id === updatedProduct._id);
        if (index !== -1) {
          state.items[index] = updatedProduct;
          state.filteredItems = applyFilters(state.items, state.filters);
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update product';
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item._id !== action.payload);
        state.filteredItems = applyFilters(state.items, state.filters);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete product';
      })
      // Toggle Favorite
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { productId, isFavorited } = action.payload;
        // Update in items array
        const product = state.items.find(item => item._id === productId);
        if (product) {
          product.isFavorite = isFavorited;
        }
        // Update in filtered items
        const filteredProduct = state.filteredItems.find(item => item._id === productId);
        if (filteredProduct) {
          filteredProduct.isFavorite = isFavorited;
        }
        // Update selected product
        if (state.selectedProduct && state.selectedProduct._id === productId) {
          state.selectedProduct.isFavorite = isFavorited;
        }
      });
  },
});

export const { setSelectedProduct, setFilters } = productsSlice.actions;
export default productsSlice.reducer; 