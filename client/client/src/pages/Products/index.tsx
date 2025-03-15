import { useParams } from 'react-router-dom';
import { Box, Container, Grid, Typography } from '@mui/material';
import ProductList from '../../components/ProductList/ProductList';
import ProductFilters from '../../components/ProductFilters/ProductFilters';

const Products = () => {
  const { category } = useParams<{ category: string }>();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Box sx={{ position: { md: 'sticky' }, top: 24 }}>
            <ProductFilters />
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          <ProductList category={category} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Products; 