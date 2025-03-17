import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Typography,
  Collapse,
  IconButton
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import StyleIcon from '@mui/icons-material/Style';
import InventoryIcon from '@mui/icons-material/Inventory';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import PaletteIcon from '@mui/icons-material/Palette';
import HomeIcon from '@mui/icons-material/Home';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

const drawerWidth = 240;
const navbarHeight = 64;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [catalogOpen, setCatalogOpen] = useState(true);

  const handleCatalogClick = () => {
    setCatalogOpen(!catalogOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    {
      text: 'Catalog',
      icon: <ShoppingBagIcon />,
      children: [
        { text: 'Products', icon: <InventoryIcon />, path: '/admin/catalog/products' },
        { text: 'Arts', icon: <PaletteIcon />, path: '/admin/catalog/arts' },
        { text: 'Categories', icon: <CategoryIcon />, path: '/admin/catalog/categories' },
        { text: 'Materials', icon: <ColorLensIcon />, path: '/admin/catalog/materials' },
      ]
    },
    { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Home Sections', icon: <HomeIcon />, path: '/admin/home-sections' },
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
          item.children ? (
            <React.Fragment key={item.text}>
              <ListItem disablePadding>
                <ListItemButton onClick={handleCatalogClick}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText>
                    <Typography variant="body2">{item.text}</Typography>
                  </ListItemText>
                  {catalogOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={catalogOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.text}
                      component={Link}
                      to={child.path}
                      selected={location.pathname === child.path}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText>
                        <Typography variant="body2">{child.text}</Typography>
                      </ListItemText>
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : (
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
          )
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 