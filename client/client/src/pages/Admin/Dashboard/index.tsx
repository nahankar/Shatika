import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Divider, List, ListItem, ListItemText, CircularProgress, Alert, Grid, Chip, Stack } from '@mui/material';
import { usersAPI, cartAPI, favoritesAPI } from '../../../services/api';
import { ShoppingCart, Favorite } from '@mui/icons-material';

interface CartProductObject {
  _id: string;
  name: string;
  price: number;
}

interface FavoriteProductObject {
  _id: string;
  name: string;
}

type CartProduct = string | CartProductObject;
type FavoriteProduct = string | FavoriteProductObject;

function isCartProductObject(product: CartProduct): product is CartProductObject {
  return typeof product !== 'string' && product !== null && '_id' in product;
}

function isFavoriteProductObject(product: FavoriteProduct): product is FavoriteProductObject {
  return typeof product !== 'string' && product !== null && '_id' in product;
}

interface RawUser {
  id: string;
  email: string;
  name: string;
  cart?: CartItem[];
  favorites?: string[];
}

interface CartItem {
  _id: string;
  product: CartProduct;
  quantity: number;
}

interface FavoriteItem {
  _id?: string;
  product: FavoriteProduct;
}

interface UserWithItems {
  _id: string;
  id: string;
  email: string;
  name: string;
  cartItems: CartItem[];
  favorites: FavoriteItem[];
}

interface ProductStats {
  _id: string;
  name: string;
  inCartCount: number;
  inFavoritesCount: number;
  usersWithInCart: Set<string>;
  usersWithInFavorites: Set<string>;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithItems[]>([]);
  const [productStats, setProductStats] = useState<Map<string, ProductStats>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching users data...');
        const usersResponse = await usersAPI.getAll();
        const rawUsers = usersResponse.data;
        console.log('Raw users:', rawUsers);

        if (!rawUsers.success || !Array.isArray(rawUsers.data)) {
          throw new Error('Invalid users data format');
        }

        // Fetch cart and favorites for each user
        const usersWithItems = await Promise.all(
          rawUsers.data.map(async (user: RawUser) => {
            console.log(`Fetching data for user ${user.name} with ID:`, {
              userId: user.id,
              userIdType: typeof user.id,
              user: user
            });

            if (!user.id) {
              console.error('Invalid user data:', user);
              return {
                ...user,
                _id: user.id,
                cartItems: [],
                favorites: []
              };
            }

            try {
              // Validate and extract cart items
              let userCartItems: CartItem[] = [];
              
              // Use user's cart array directly
              if (user.cart && Array.isArray(user.cart)) {
                userCartItems = user.cart;
                console.log('Using cart from user data:', {
                  userId: user.id,
                  name: user.name,
                  cartItems: userCartItems
                });
              }

              // Validate and extract favorites
              let userFavorites: string[] = [];
              
              // Use user's favorites array directly
              if (user.favorites && Array.isArray(user.favorites)) {
                userFavorites = user.favorites;
                console.log('Using favorites from user data:', {
                  userId: user.id,
                  name: user.name,
                  favorites: userFavorites
                });
              }

              // Convert favorites array to FavoriteItem objects
              const favoriteItems: FavoriteItem[] = userFavorites.map(productId => ({
                product: productId
              }));

              return {
                ...user,
                _id: user.id,
                cartItems: userCartItems,
                favorites: favoriteItems
              };
            } catch (error) {
              console.warn(`Error fetching data for user ${user.name}:`, error);
              return {
                ...user,
                _id: user.id,
                cartItems: [],
                favorites: []
              };
            }
          })
        );

        console.log('Users with items:', usersWithItems);
        setUsers(usersWithItems);

        // Calculate product statistics
        const stats = new Map<string, ProductStats>();
        
        usersWithItems.forEach((user: UserWithItems) => {
          // Process cart items
          user.cartItems.forEach((item: CartItem) => {
            if (!item?.product?._id) {
              console.warn('Invalid cart item:', item);
              return;
            }
            
            const productId = item.product._id;
            if (!stats.has(productId)) {
              stats.set(productId, {
                _id: productId,
                name: item.product.name,
                inCartCount: 0,
                inFavoritesCount: 0,
                usersWithInCart: new Set(),
                usersWithInFavorites: new Set()
              });
            }
            const productStats = stats.get(productId)!;
            if (!productStats.usersWithInCart.has(user._id)) {
              productStats.inCartCount++;
              productStats.usersWithInCart.add(user._id);
            }
          });

          // Process favorites
          user.favorites.forEach((item: FavoriteItem) => {
            if (!item?.product?._id) {
              console.warn('Invalid favorite item:', item);
              return;
            }
            
            const productId = item.product._id;
            if (!stats.has(productId)) {
              stats.set(productId, {
                _id: productId,
                name: item.product.name,
                inCartCount: 0,
                inFavoritesCount: 0,
                usersWithInCart: new Set(),
                usersWithInFavorites: new Set()
              });
            }
            const productStats = stats.get(productId)!;
            if (!productStats.usersWithInFavorites.has(user._id)) {
              productStats.inFavoritesCount++;
              productStats.usersWithInFavorites.add(user._id);
            }
          });
        });

        console.log('Product statistics:', Array.from(stats.values()));
        setProductStats(stats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Typography variant="h5" gutterBottom>
        Users and Their Items
      </Typography>
      <Grid container spacing={3}>
        {users.map(user => (
          <Grid item xs={12} md={6} key={`user-${user.id || Math.random()}`}>
            <Card>
              <CardContent>
                <Typography variant="h6">{user.name}</Typography>
                <Typography color="textSecondary" gutterBottom>{user.email}</Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ShoppingCart fontSize="small" />
                    <Typography variant="subtitle1">
                      Cart Items ({user.cartItems.length})
                    </Typography>
                  </Stack>
                  <List dense>
                    {user.cartItems.map(item => {
                      let displayInfo = {
                        id: '',
                        name: '',
                        quantity: item.quantity
                      };

                      if (isCartProductObject(item.product)) {
                        displayInfo.id = item.product._id;
                        displayInfo.name = item.product.name;
                      } else {
                        displayInfo.id = item.product;
                        displayInfo.name = `Product ID: ${item.product}`;
                      }
                      
                      return (
                        <ListItem key={`cart-${user.id}-${displayInfo.id}`}>
                          <ListItemText
                            primary={displayInfo.name}
                            secondary={`Quantity: ${displayInfo.quantity}`}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Favorite fontSize="small" />
                    <Typography variant="subtitle1">
                      Favorites ({user.favorites.length})
                    </Typography>
                  </Stack>
                  <List dense>
                    {user.favorites.map((item, index) => {
                      let displayInfo = {
                        id: '',
                        name: ''
                      };

                      if (isFavoriteProductObject(item.product)) {
                        displayInfo.id = item.product._id;
                        displayInfo.name = item.product.name;
                      } else {
                        displayInfo.id = item.product;
                        displayInfo.name = `Product ID: ${item.product}`;
                      }

                      return (
                        <ListItem key={`favorite-${user.id}-${displayInfo.id || index}`}>
                          <ListItemText primary={displayInfo.name} />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mt: 4 }} gutterBottom>
        Product Statistics
      </Typography>
      <Grid container spacing={3}>
        {Array.from(productStats.values()).map(stats => (
          <Grid item xs={12} md={4} key={`product-${stats._id}`}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{stats.name}</Typography>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ShoppingCart fontSize="small" />
                    <Typography>
                      {stats.inCartCount} user{stats.inCartCount !== 1 ? 's' : ''}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Favorite fontSize="small" />
                    <Typography>
                      {stats.inFavoritesCount} user{stats.inFavoritesCount !== 1 ? 's' : ''}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 