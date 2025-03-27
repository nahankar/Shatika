import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, CircularProgress, Alert, Grid } from '@mui/material';
import { ShoppingCart, Favorite } from '@mui/icons-material';
import { usersAPI } from '../../../services/api';

interface ProductBase {
  _id: string;
  name: string;
  price: number;
}

interface CartProduct extends ProductBase {
  quantity: number;
}

interface CartItem {
  product: CartProduct | string;
  quantity?: number;
}

interface FavoriteItem {
  product: ProductBase | string;
}

interface UserWithItems {
  _id: string;
  name: string;
  email: string;
  cartItems: CartItem[];
  favorites: FavoriteItem[];
}

interface DashboardStats {
  totalUsers: number;
  usersWithCartItems: Set<string>;
  usersWithInFavorites: Set<string>;
}

// Helper functions
function isProductBase(product: any): product is ProductBase {
  return typeof product === 'object' && product !== null && '_id' in product && 'name' in product;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserWithItems[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    usersWithCartItems: new Set(),
    usersWithInFavorites: new Set(),
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const rawUsers = await usersAPI.getAll();
        
        if (!rawUsers.data || !rawUsers.data.success) {
          console.error('Failed to fetch users');
          return;
        }

        // Fetch cart and favorites for each user
        const usersWithItems = await Promise.all(
          rawUsers.data.data.map(async (user: UserWithItems) => {
            if (!user._id) {
              console.error('Invalid user data:', user);
              return {
                ...user,
                cartItems: [],
                favorites: []
              };
            }

            try {
              let userCartItems: CartItem[] = [];
              if (user.cartItems && Array.isArray(user.cartItems)) {
                userCartItems = user.cartItems;
              }

              let userFavorites: FavoriteItem[] = [];
              if (user.favorites && Array.isArray(user.favorites)) {
                userFavorites = user.favorites;
              }

              return {
                ...user,
                cartItems: userCartItems,
                favorites: userFavorites
              };
            } catch (error) {
              console.warn(`Error fetching data for user ${user.name}:`, error);
              return {
                ...user,
                cartItems: [],
                favorites: []
              };
            }
          })
        );

        setUsers(usersWithItems);

        // Update stats
        const newStats: DashboardStats = {
          totalUsers: usersWithItems.length,
          usersWithCartItems: new Set(
            usersWithItems
              .filter(user => user.cartItems && user.cartItems.length > 0)
              .map(user => user._id)
          ),
          usersWithInFavorites: new Set(
            usersWithItems
              .filter(user => user.favorites && user.favorites.length > 0)
              .map(user => user._id)
          ),
        };

        setStats(newStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchUsers();
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
          <Grid item xs={12} md={6} key={`user-${user._id}`}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {user.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {user.email}
                </Typography>

                {/* Cart Items */}
                <Typography variant="subtitle1" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <ShoppingCart sx={{ mr: 1 }} /> Cart Items
                </Typography>
                <List>
                  {user.cartItems.map((item, index) => {
                    const displayInfo = {
                      id: '',
                      name: '',
                      quantity: item.quantity || 0
                    };

                    if (typeof item.product === 'string') {
                      displayInfo.id = item.product;
                      displayInfo.name = `Product ID: ${item.product}`;
                    } else {
                      displayInfo.id = item.product._id;
                      displayInfo.name = item.product.name;
                    }

                    return (
                      <ListItem key={`cart-${user._id}-${displayInfo.id}`}>
                        <ListItemText
                          primary={displayInfo.name}
                          secondary={`Quantity: ${displayInfo.quantity}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>

                {/* Favorites */}
                <Typography variant="subtitle1" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <Favorite sx={{ mr: 1 }} /> Favorites
                </Typography>
                <List>
                  {user.favorites.map((item, index) => {
                    const displayInfo = {
                      id: '',
                      name: ''
                    };

                    if (typeof item.product === 'string') {
                      displayInfo.id = item.product;
                      displayInfo.name = `Product ID: ${item.product}`;
                    } else {
                      displayInfo.id = item.product._id;
                      displayInfo.name = item.product.name;
                    }

                    return (
                      <ListItem key={`favorite-${user._id}-${displayInfo.id || index}`}>
                        <ListItemText primary={displayInfo.name} />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mt: 4 }} gutterBottom>
        Statistics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Users
              </Typography>
              <Typography>
                {stats.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users with Cart Items
              </Typography>
              <Typography>
                {stats.usersWithCartItems.size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users with Favorites
              </Typography>
              <Typography>
                {stats.usersWithInFavorites.size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 