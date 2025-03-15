import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subCategory?: string;
  variants?: {
    color?: string;
    size?: string;
    stock: number;
  }[];
  specifications?: {
    material?: string;
    care?: string[];
    dimensions?: string;
  };
  tags: string[];
  isFavorite: boolean;
}

interface ProductsState {
  items: Product[];
  filteredItems: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: {
    category: string | null;
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
    category: null,
    priceRange: null,
    tags: [],
  },
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      state.filteredItems = action.payload;
      state.loading = false;
    },
    fetchProductsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ProductsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Apply filters
      state.filteredItems = state.items.filter((product) => {
        const categoryMatch = !state.filters.category || 
          product.category === state.filters.category;
        
        const priceMatch = !state.filters.priceRange || 
          (product.price >= state.filters.priceRange[0] && 
           product.price <= state.filters.priceRange[1]);
        
        const tagsMatch = state.filters.tags.length === 0 || 
          state.filters.tags.some(tag => product.tags.includes(tag));
        
        return categoryMatch && priceMatch && tagsMatch;
      });
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const product = state.items.find(p => p.id === action.payload);
      if (product) {
        product.isFavorite = !product.isFavorite;
      }
      // Also update in filteredItems
      const filteredProduct = state.filteredItems.find(p => p.id === action.payload);
      if (filteredProduct) {
        filteredProduct.isFavorite = !filteredProduct.isFavorite;
      }
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  setSelectedProduct,
  setFilters,
  toggleFavorite,
} = productSlice.actions;

export default productSlice.reducer; 