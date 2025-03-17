import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from '../../components/Admin/Sidebar';
import Dashboard from './Dashboard';
import ProductsManagement from './ProductsManagement';
import UsersManagement from './UsersManagement';
import MaterialsManagement from '../Admin/MaterialsManagement';
import CategoriesManagement from '../Admin/CategoriesManagement';
import ArtsManagement from '../Admin/ArtsManagement/index';
import HomeSectionsManagement from './HomeSectionsManagement';

const navbarHeight = 64; // Standard MUI AppBar height

const AdminDashboard = () => {
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
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="products/*" element={<ProductsManagement />} />
          <Route path="users/*" element={<UsersManagement />} />
          <Route path="materials" element={<MaterialsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="arts" element={<ArtsManagement />} />
          <Route path="home-sections" element={<HomeSectionsManagement />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminDashboard;