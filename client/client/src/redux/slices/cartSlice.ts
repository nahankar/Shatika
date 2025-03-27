import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CartItem } from '../../types/product';
import { cartAPI } from '../../services/api';
import { RootState } from '../store';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  size?: string;
}

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async () => {
    try {
      const response = await cartAPI.getItems();
      console.log('Raw Cart Response:', response);
      console.log('Cart Response Data:', response.data);
      
      // Always expect the response to be in { success: true, data: [...] } format
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        console.error('Invalid cart data format:', response.data);
        return [];
      }
      
      // Log each cart item's ID before processing
      response.data.data.forEach((item: any, index: number) => {
        console.log(`Cart Item ${index}:`, {
          _id: item._id,
          _idType: typeof item._id,
          _idToString: item._id?.toString?.(),
          product: item.product,
          productType: typeof item.product,
          productToString: item.product?.toString?.()
        });
      });
      
      // Ensure each cart item has the required fields
      const items = response.data.data.map((item: any) => {
        if (!item._id || !item.product || !item.quantity) {
          console.error('Invalid cart item:', item);
          return null;
        }
        
        const processedItem = {
          _id: item._id.toString(),
          product: item.product,
          quantity: item.quantity,
          size: item.size,
          color: item.color
        };
        
        console.log('Processed cart item:', processedItem);
        return processedItem;
      }).filter(Boolean);

      console.log('Final processed cart items:', items);
      return items;
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }: AddToCartPayload, { dispatch }) => {
    const response = await cartAPI.add(productId, quantity);
    // After adding to cart, fetch the updated cart to get full product details
    await dispatch(fetchCart()).unwrap();
    return response.data;
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }, { dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const cartItem = state.cart.items.find(item => item._id === cartItemId);
      
      console.log('Updating cart item:', {
        cartItemId,
        cartItemIdType: typeof cartItemId,
        quantity,
        existingItem: cartItem,
        existingItemId: cartItem?._id,
        existingItemIdType: typeof cartItem?._id,
        allItems: state.cart.items.map(item => ({
          _id: item._id,
          _idType: typeof item._id,
          product: item.product._id
        }))
      });
      
      const response = await cartAPI.update(cartItemId, quantity);
      console.log('Update cart response:', response.data);
      
      // After updating quantity, fetch the updated cart to get full product details
      await dispatch(fetchCart());
      return response.data;
    } catch (error: any) {
      console.error('Error updating cart:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: `/cart/${cartItemId}`,
        requestData: { quantity }
      });
      throw new Error(
        error.response?.data?.message ||
        `Failed to update cart item (${error.response?.status || 'unknown error'})`
      );
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (cartItemId: string, { dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const cartItem = state.cart.items.find(item => item._id === cartItemId);
      
      console.log('Removing cart item:', {
        cartItemId,
        existingItem: cartItem,
        allItems: state.cart.items
      });
      
      await cartAPI.remove(cartItemId);
      // After removing from cart, fetch the updated cart
      const response = await dispatch(fetchCart()).unwrap();
      return cartItemId;
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      // If it's not an auth error, try to fetch the latest state
      if (error.response?.status !== 401) {
        try {
          await dispatch(fetchCart()).unwrap();
        } catch (fetchError) {
          console.error('Error fetching cart after removal:', fetchError);
        }
      }
      throw error;
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async () => {
    await cartAPI.clear();
    return null;
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    clearCartState: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cart';
        state.items = [];
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state) => {
        state.loading = false;
        // Cart items will be updated by fetchCart
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add to cart';
      })
      // Update Quantity
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state) => {
        state.loading = false;
        // Cart items will be updated by fetchCart
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update quantity';
      })
      // Remove from Cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Don't update items here - they will be updated by fetchCart
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to remove from cart';
      })
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to clear cart';
      });
  },
});

// Selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartLoading = (state: RootState) => state.cart.loading;
export const selectCartError = (state: RootState) => state.cart.error;
export const selectCartTotalQuantity = (state: RootState) => 
  state.cart.items.reduce((total, item) => total + (item.quantity || 0), 0);

export const { resetCart, clearCartState } = cartSlice.actions;
export default cartSlice.reducer; 