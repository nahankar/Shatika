import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  ShoppingBag as CatalogIcon,
  Category as CategoriesIcon,
  Palette as MaterialsIcon,
  People as UsersIcon,
  Home as HomeIcon,
  Store as ProductsIcon,
  Brush as ArtsIcon,
  Extension as DesignElementsIcon,
} from '@mui/icons-material';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  adminOnly?: boolean;
}

const Navigation: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['catalog']);
  const isAdmin = true; // Replace with actual admin check logic

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      title: 'Catalog',
      icon: <CatalogIcon />,
      children: [
        {
          title: 'Products',
          icon: <ProductsIcon />,
          path: '/products',
        },
        {
          title: 'Arts',
          icon: <ArtsIcon />,
          path: '/arts',
        },
        {
          title: 'Categories',
          icon: <CategoriesIcon />,
          path: '/categories',
        },
        {
          title: 'Materials',
          icon: <MaterialsIcon />,
          path: '/materials',
        },
        {
          title: 'Design Elements',
          icon: <DesignElementsIcon />,
          path: '/design-elements',
          adminOnly: true,
        },
      ],
    },
    {
      title: 'Users',
      icon: <UsersIcon />,
      path: '/users',
    },
    {
      title: 'Home Sections',
      icon: <HomeIcon />,
      path: '/home-sections',
    },
  ];

  const handleItemClick = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (item.adminOnly && !isAdmin) {
      return null;
    }

    const isExpanded = expandedItems.includes(item.title.toLowerCase());
    const hasChildren = item.children && item.children.length > 0;
    const paddingLeft = level * 2;

    return (
      <React.Fragment key={item.title}>
        <ListItemButton
          component={item.path ? Link : 'div'}
          to={item.path}
          onClick={() => hasChildren && handleItemClick(item.title.toLowerCase())}
          sx={{
            pl: paddingLeft + 2,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.title} />
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item.title.toLowerCase());
              }}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <List component="nav">
      {menuItems.map((item) => renderMenuItem(item))}
    </List>
  );
};

export default Navigation; 