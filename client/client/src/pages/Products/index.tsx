import { useParams, useLocation } from 'react-router-dom';
import { Box, Container, Grid, Typography } from '@mui/material';
import ProductList from '../../components/ProductList/ProductList';
import ProductFilters from '../../components/ProductFilters/ProductFilters';

const Products = () => {
  const { category } = useParams<{ category: string }>();
  const location = useLocation();
  
  // Check if we're in DIY selection mode
  const searchParams = new URLSearchParams(location.search);
  const forDIY = searchParams.get('forDIY') === 'true';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {forDIY 
          ? 'Select a Fabric for Your Project'
          : category 
            ? category.charAt(0).toUpperCase() + category.slice(1) 
            : 'All Products'
        }
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Box sx={{ position: { md: 'sticky' }, top: 24 }}>
            <ProductFilters />
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          <ProductList category={category} forDIY={forDIY} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Products; 