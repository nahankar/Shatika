import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
  CardActionArea,
  CircularProgress,
  Button,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Product } from '../../types/product';
import { RootState, useAppDispatch } from '../../redux/store';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import { toggleFavorite } from '../../redux/slices/productsSlice';
import ShareMenu from '../ShareMenu/ShareMenu';

interface ProductCardProps {
  product: Product;
  forDIY?: boolean;
  onSelect?: () => void;
}

const DEFAULT_IMAGE = '/placeholder.jpg'; // Add a placeholder image to your public folder

const ProductCard = ({ product, forDIY = false, onSelect }: ProductCardProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const favorites = useSelector((state: RootState) => state.favorites.items) || [];
  const isFavorite = favorites?.some(fav => fav?._id === product?._id) || false;
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    try {
      setIsLoading(true);
      await dispatch(toggleFavorite(product._id)).unwrap();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      navigate(`/products/${product._id}`);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {!forDIY && <ShareMenu product={product} />}
        {!forDIY && (
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' },
              zIndex: 1,
            }}
            onClick={handleFavoriteClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={20} />
            ) : isFavorite ? (
              <FavoriteIcon color="error" />
            ) : (
              <FavoriteBorderIcon />
            )}
          </IconButton>
        )}
        <CardActionArea onClick={handleClick}>
          <CardMedia
            component="img"
            height="200"
            image={product.images?.[0] || DEFAULT_IMAGE}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography gutterBottom variant="h6" component="h2" noWrap>
              {product.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {product.description}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="primary">
                ₹{product.price.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {typeof product.category === 'object' && product.category !== null 
                  ? product.category.name 
                  : product.category}
              </Typography>
            </Box>
            {forDIY && (
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={handleClick}
              >
                Select This Fabric
              </Button>
            )}
          </CardContent>
        </CardActionArea>
      </Box>
    </Card>
  );
};

export default ProductCard; 