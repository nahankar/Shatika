import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Button,
  Divider,
  TextField,
  CircularProgress,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { RootState, useAppDispatch } from '../../redux/store';
import { removeFromCart, updateCartQuantity, fetchCart } from '../../redux/slices/cartSlice';
import { CartItem } from '../../types/product';
import { useEffect } from 'react';

const Cart = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, error } = useSelector((state: RootState) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Ensure items is always an array
  const cartItems = Array.isArray(items) ? items : [];

  // Calculate totals with type safety
  const subtotal = cartItems.reduce((total, item) => {
    const price = typeof item.product?.price === 'number' ? item.product.price : 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    return total + (price * quantity);
  }, 0);
  
  const shipping = subtotal > 1000 ? 0 : 100; // Free shipping over ₹1000
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (cartItemId: string, quantity: number) => {
    if (!cartItemId) {
      console.error('Cart item ID is undefined');
      return;
    }
    
    console.log('Handling quantity change:', {
      cartItemId,
      cartItemIdType: typeof cartItemId,
      quantity,
      currentItems: cartItems.map(item => ({
        _id: item._id,
        _idType: typeof item._id,
        product: item.product._id
      }))
    });
    
    if (quantity < 1) {
      dispatch(removeFromCart(cartItemId));
    } else {
      dispatch(updateCartQuantity({ cartItemId, quantity }));
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    if (!cartItemId) {
      console.error('Cart item ID is undefined');
      return;
    }
    
    console.log('Handling remove item:', {
      cartItemId,
      cartItemIdType: typeof cartItemId,
      currentItems: cartItems.map(item => ({
        _id: item._id,
        _idType: typeof item._id,
        product: item.product._id
      }))
    });
    
    dispatch(removeFromCart(cartItemId));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  if (!cartItems.length) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Shopping Cart
      </Typography>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          {cartItems.map((item, index) => (
            <Card key={`${item._id}-${index}`} sx={{ mb: 2 }}>
              <Grid container spacing={2} sx={{ p: 2 }}>
                <Grid item xs={4} sm={3}>
                  <CardMedia
                    component="img"
                    image={item.product?.images?.[0] || '/placeholder.jpg'}
                    alt={item.product?.name || 'Product'}
                    sx={{ borderRadius: 1, height: '100%', objectFit: 'cover' }}
                  />
                </Grid>
                <Grid item xs={8} sm={9}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {item.product?.name || 'Unnamed Product'}
                      </Typography>
                      <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
                        ₹{(typeof item.product?.price === 'number' ? item.product.price : 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(item._id)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(item._id, (item.quantity || 1) - 1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <TextField
                      size="small"
                      value={item.quantity || 1}
                      onChange={(e) =>
                        handleQuantityChange(item._id, Number(e.target.value))
                      }
                      inputProps={{
                        min: 1,
                        max: 10,
                        style: { textAlign: 'center', width: '40px' },
                      }}
                      sx={{ mx: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleQuantityChange(item._id, (item.quantity || 1) + 1)}
                      disabled={(item.quantity || 1) >= 10}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Subtotal</Typography>
                <Typography variant="body1">₹{subtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Shipping</Typography>
                <Typography variant="body1">₹{shipping.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Tax (18% GST)</Typography>
                <Typography variant="body1">₹{tax.toLocaleString()}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">₹{total.toLocaleString()}</Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={() => navigate('/checkout')}
              sx={{ mt: 2 }}
            >
              Proceed to Checkout
            </Button>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => navigate('/products')}
              sx={{ mt: 2 }}
            >
              Continue Shopping
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;