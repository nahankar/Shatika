import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { RootState, useAppDispatch } from '../../redux/store';
import { selectIsAuthenticated, selectUser, logout } from '../../redux/slices/authSlice';
import { selectCartTotalQuantity } from '../../redux/slices/cartSlice';

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const favoriteItems = useSelector((state: RootState) => state.favorites.items);
  const cartQuantity = useSelector(selectCartTotalQuantity);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    handleMobileMenuClose();
    navigate('/');
  };

  const navigateTo = (path: string) => {
    handleMobileMenuClose();
    navigate(path);
  };

  return (
    <AppBar position="sticky">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMobileMenuOpen}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          Shatika
        </Typography>

        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Button color="inherit" component={Link} to="/products">
            Products
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to={isAuthenticated ? "/diy" : "/login?returnUrl=/diy"}
          >
            DIY
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <IconButton color="inherit" component={Link} to="/favorites">
                <Badge badgeContent={favoriteItems.length} color="secondary">
                  <FavoriteIcon />
                </Badge>
              </IconButton>

              <IconButton color="inherit" component={Link} to="/cart">
                <Badge badgeContent={cartQuantity} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>

              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <Typography variant="body1" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                  {user?.name}
                </Typography>
                <IconButton
                  color="inherit"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleClose}>
                    Profile
                  </MenuItem>
                  {user?.role === 'admin' && (
                    <MenuItem component={Link} to="/admin" onClick={handleClose}>
                      Admin Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
          )}
        </Box>

        {/* Mobile Menu */}
        <Menu
          id="mobile-menu"
          anchorEl={mobileMenuAnchorEl}
          keepMounted
          open={Boolean(mobileMenuAnchorEl)}
          onClose={handleMobileMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{ mt: 4 }}
        >
          <MenuItem onClick={() => navigateTo('/products')}>
            Products
          </MenuItem>
          <MenuItem onClick={() => navigateTo(isAuthenticated ? '/diy' : '/login?returnUrl=/diy')}>
            DIY
          </MenuItem>
          {isAuthenticated ? [
              <MenuItem key="profile" onClick={() => navigateTo('/profile')}>
                Profile
              </MenuItem>,
              user?.role === 'admin' && 
                <MenuItem key="admin" onClick={() => navigateTo('/admin')}>
                  Admin Dashboard
                </MenuItem>,
              <MenuItem key="logout" onClick={handleLogout}>
                Logout
              </MenuItem>
            ] : 
            <MenuItem onClick={() => navigateTo('/login')}>
              Login
            </MenuItem>
          }
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 