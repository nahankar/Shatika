import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import StyleIcon from '@mui/icons-material/Style';
import InventoryIcon from '@mui/icons-material/Inventory';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import PaletteIcon from '@mui/icons-material/Palette';
import HomeIcon from '@mui/icons-material/Home';

const drawerWidth = 240;
const navbarHeight = 64; // Standard MUI AppBar height

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Products', icon: <InventoryIcon />, path: '/admin/dashboard/products' },
    { text: 'Users', icon: <PeopleIcon />, path: '/admin/dashboard/users' },
    { text: 'Materials', icon: <ColorLensIcon />, path: '/admin/dashboard/materials' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/admin/dashboard/categories' },
    { text: 'Arts', icon: <PaletteIcon />, path: '/admin/dashboard/arts' },
    { text: 'Home Sections', icon: <HomeIcon />, path: '/admin/dashboard/home-sections' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: `${navbarHeight}px`,
          height: `calc(100% - ${navbarHeight}px)`,
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>
                <Typography variant="body2">{item.text}</Typography>
              </ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 