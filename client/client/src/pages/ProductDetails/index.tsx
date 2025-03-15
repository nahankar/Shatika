import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Snackbar,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { RootState, useAppDispatch } from '../../redux/store';
import { toggleFavorite, fetchProduct, setSelectedProduct } from '../../redux/slices/productsSlice';
import { Product } from '../../types/product';
import { addToCart } from '../../redux/slices/cartSlice';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface ProductsState {
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { selectedProduct, loading, error } = useSelector((state: RootState) => state.products as ProductsState);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorState, setError] = useState<string | null>(null);

  const isFavorited = selectedProduct ? favorites.some(fav => fav._id === selectedProduct._id) : false;

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedProduct?._id]);

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id)).unwrap()
        .catch((error) => {
          console.error('Error fetching product:', error);
        });
    }

    return () => {
      dispatch(setSelectedProduct(null));
    };
  }, [id, dispatch]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !selectedProduct) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/')}>
              Go Back
            </Button>
          }
        >
          {error || 'Product not found'}
        </Alert>
      </Container>
    );
  }

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(10, value));
    setQuantity(newQuantity);
  };

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (selectedProduct) {
      try {
        setError(null);
        await dispatch(toggleFavorite(selectedProduct._id)).unwrap();
      } catch (error) {
        console.error('Error toggling favorite:', error);
        setError('Failed to update favorite status. Please try again.');
      }
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!selectedProduct) return;

    const hasRequiredVariants = 
      (selectedProduct.variants?.some(v => v.size) && !selectedSize) ||
      (selectedProduct.variants?.some(v => v.color) && !selectedColor);

    if (hasRequiredVariants) {
      // Show error message if variants are required but not selected
      return;
    }

    dispatch(addToCart({
      productId: selectedProduct._id,
      quantity,
      size: selectedSize,
      color: selectedColor,
    }));

    setSnackbarOpen(true);
  };

  const productImages = selectedProduct.images || [];
  const currentImage = productImages[selectedImage] || '/placeholder.jpg';

  if (errorState) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          action={
            <Button color="inherit" size="small" onClick={() => setError(null)}>
              Dismiss
            </Button>
          }
        >
          {errorState}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={currentImage}
              alt={selectedProduct.name}
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 1,
              }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' },
              }}
              onClick={handleFavoriteClick}
            >
              {isFavorited ? (
                <FavoriteIcon color="error" />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
          </Box>
          {productImages.length > 0 && (
            <Grid container spacing={1} sx={{ mt: 2 }}>
              {productImages.map((image, index) => (
                <Grid item key={index} xs={3}>
                  <Box
                    component="img"
                    src={image}
                    alt={`${selectedProduct.name} ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: index === selectedImage ? '2px solid primary.main' : 'none',
                    }}
                    onClick={() => setSelectedImage(index)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {selectedProduct.name}
          </Typography>
          
          <Typography variant="h5" color="primary" gutterBottom>
            ₹{selectedProduct.price.toLocaleString()}
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            {selectedProduct.description}
          </Typography>

          <Box sx={{ my: 3 }}>
            {selectedProduct.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                sx={{ mr: 1, mb: 1 }}
                variant="outlined"
              />
            ))}
          </Box>

          {selectedProduct.variants && (
            <Box sx={{ my: 3 }}>
              {selectedProduct.variants.some(v => v.size) && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Size</InputLabel>
                  <Select
                    value={selectedSize}
                    label="Size"
                    onChange={(e) => setSelectedSize(e.target.value)}
                  >
                    {Array.from(
                      new Set(selectedProduct.variants.map(v => v.size).filter(Boolean))
                    ).map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {selectedProduct.variants.some(v => v.color) && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={selectedColor}
                    label="Color"
                    onChange={(e) => setSelectedColor(e.target.value)}
                  >
                    {Array.from(
                      new Set(selectedProduct.variants.map(v => v.color).filter(Boolean))
                    ).map((color) => (
                      <MenuItem key={color} value={color}>
                        {color}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}

          {/* Quantity Selector */}
          <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Quantity:
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <RemoveIcon />
            </IconButton>
            <TextField
              size="small"
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              inputProps={{
                min: 1,
                max: 10,
                style: { textAlign: 'center', width: '40px' },
              }}
              sx={{ mx: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= 10}
            >
              <AddIcon />
            </IconButton>
          </Box>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleAddToCart}
            sx={{ mt: 2 }}
          >
            Add to Cart
          </Button>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              aria-label="product information tabs"
            >
              <Tab label="Specifications" />
              <Tab label="Care Instructions" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {selectedProduct.specifications && (
                <Box>
                  {selectedProduct.specifications.material && (
                    <Typography paragraph>
                      <strong>Material:</strong> {selectedProduct.specifications.material}
                    </Typography>
                  )}
                  {selectedProduct.specifications.dimensions && (
                    <Typography paragraph>
                      <strong>Dimensions:</strong> {selectedProduct.specifications.dimensions}
                    </Typography>
                  )}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {selectedProduct.specifications?.care && (
                <Box component="ul" sx={{ pl: 2 }}>
                  {selectedProduct.specifications.care.map((instruction, index) => (
                    <Typography component="li" key={index} paragraph>
                      {instruction}
                    </Typography>
                  ))}
                </Box>
              )}
            </TabPanel>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Product added to cart"
        action={
          <Button color="primary" size="small" onClick={() => navigate('/cart')}>
            View Cart
          </Button>
        }
      />
    </Container>
  );
};

export default ProductDetails; 