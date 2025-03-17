import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const navbarHeight = 64;

const AdminLayout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', mt: `${navbarHeight}px` }}>
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          minHeight: `calc(100vh - ${navbarHeight}px)`,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 