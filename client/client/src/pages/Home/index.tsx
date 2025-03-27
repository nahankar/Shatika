import { Box, Container, Typography, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setFilters } from '../../redux/slices/productsSlice';
import { useEffect, useState } from 'react';
import { homeSectionsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

interface HomeSection {
  _id: string;
  type: 'category' | 'art';
  name: string;
  displayOrder: number;
  image: string;
  isActive: boolean;
}

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [categorySections, setCategorySections] = useState<HomeSection[]>([]);
  const [artSections, setArtSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await homeSectionsAPI.getAll();
      if (response.data.success) {
        const sections = response.data.data as HomeSection[];
        setCategorySections(sections
          .filter((s: HomeSection) => s.type === 'category' && s.isActive)
          .sort((a: HomeSection, b: HomeSection) => a.displayOrder - b.displayOrder)
        );
        setArtSections(sections
          .filter((s: HomeSection) => s.type === 'art' && s.isActive)
          .sort((a: HomeSection, b: HomeSection) => a.displayOrder - b.displayOrder)
        );
      } else {
        enqueueSnackbar(response.data.message || 'Error fetching sections', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      enqueueSnackbar('Error fetching sections', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    dispatch(setFilters({ categories: [category] }));
    navigate('/products');
  };

  const handleArtClick = (art: string) => {
    dispatch(setFilters({ arts: [art] }));
    navigate('/products');
  };

  return (
    <Box sx={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Hero Section */}
      <Box sx={{ 
        width: '100%',
        bgcolor: 'background.paper',
        pt: 8,
        pb: 6,
      }}>
        <Container maxWidth="lg" sx={{ width: '100%' }}>
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
            sx={{
              fontSize: { xs: '2.5rem', md: '3.75rem' },
              fontWeight: 600,
            }}
          >
            Wearable Art - Made by Hand
          </Typography>
          <Typography 
            variant="h5" 
            align="center" 
            color="text.secondary" 
            paragraph
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              px: 2,
            }}
          >
            Discover our collection of handcrafted sarees, blouses, and ethnic wear.
            Each piece tells a story of tradition, craftsmanship, and elegance.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate('/products')}
            >
              Shop Now
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              onClick={() => {
                const isLoggedIn = !!localStorage.getItem('token');
                if (isLoggedIn) {
                  navigate('/diy');
                } else {
                  // Redirect to login with a return URL to DIY
                  navigate('/login?returnUrl=/diy');
                }
              }}
            >
              Design It Yourself
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Categories
        </Typography>
        <Grid container spacing={4}>
          {categorySections.map((section) => (
            <Grid item key={section._id} xs={12} sm={6} md={3}>
              <Box
                onClick={() => handleCategoryClick(section.name)}
                sx={{
                  height: 200,
                  backgroundImage: `url(${section.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  position: 'relative',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: 2,
                    transition: 'background-color 0.3s',
                  },
                  '&:hover:before': {
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  },
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    fontWeight: 'bold',
                  }}
                >
                  {section.name}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Arts Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Arts
        </Typography>
        <Grid container spacing={4}>
          {artSections.map((section) => (
            <Grid item key={section._id} xs={12} sm={6} md={3}>
              <Box
                onClick={() => handleArtClick(section.name)}
                sx={{
                  height: 200,
                  backgroundImage: `url(${section.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  position: 'relative',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: 2,
                    transition: 'background-color 0.3s',
                  },
                  '&:hover:before': {
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  },
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    fontWeight: 'bold',
                  }}
                >
                  {section.name}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 