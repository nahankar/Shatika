import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { projectsAPI } from '../../services/api';

const AddProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fabricImageUrl: '',
    selectedProductId: '',
    productCategory: '',
    productMaterial: '',
    productMaterialName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (location.state) {
      if (location.state.selectedProduct) {
        const { selectedProduct } = location.state;
        console.log("Selected product in AddProject:", selectedProduct);
        
        let materialId = '';
        let materialName = '';
        
        if (selectedProduct.material) {
          if (typeof selectedProduct.material === 'object' && selectedProduct.material !== null) {
            materialId = selectedProduct.material._id || '';
            materialName = selectedProduct.material.name || '';
          } else if (typeof selectedProduct.material === 'string') {
            materialId = selectedProduct.material;
          }
        }
        
        setFormData(prev => ({
          ...prev,
          fabricImageUrl: selectedProduct.images?.[0] || '',
          selectedProductId: selectedProduct._id || '',
          productCategory: 
            selectedProduct.category && typeof selectedProduct.category === 'object' && selectedProduct.category.name 
              ? selectedProduct.category.name 
              : typeof selectedProduct.category === 'string' 
                ? selectedProduct.category 
                : '',
          productMaterial: materialId,
          productMaterialName: materialName,
        }));
      }
      
      if (location.state.formData) {
        setFormData(prev => ({
          ...prev,
          ...location.state.formData,
        }));
      }
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const navigateToProductSelection = () => {
    navigate('/products?forDIY=true', {
      state: {
        formData: {
          name: formData.name,
          description: formData.description,
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!formData.fabricImageUrl || !formData.selectedProductId) {
        setError("Please select a fabric from products.");
        setLoading(false);
        return;
      }
      
      const projectData = new FormData();
      projectData.append('name', formData.name);
      projectData.append('description', formData.description);
      projectData.append('fabricCategory', formData.productCategory || 'Fabric');
      
      if (formData.productMaterial) {
        projectData.append('materialId', formData.productMaterial);
        console.log('Sending materialId:', formData.productMaterial);
      }
      
      if (formData.productMaterialName) {
        projectData.append('materialName', formData.productMaterialName);
        console.log('Sending materialName:', formData.productMaterialName);
      }
      
      if (formData.fabricImageUrl && !formData.selectedProductId) {
        projectData.append('fabricImage', formData.fabricImageUrl);
      }
      
      if (formData.selectedProductId) {
        projectData.append('selectedProductId', formData.selectedProductId);
        console.log('Sending selectedProductId:', formData.selectedProductId);
      }
      
      const response = await projectsAPI.create(projectData);
      
      if (response.data && response.data.success) {
        const projectId = response.data.data._id;
        navigate(`/diy/design/${projectId}`, { 
          state: { 
            projectData: {
              ...response.data.data,
              materialId: formData.productMaterial,
              materialName: formData.productMaterialName,
              category: formData.productCategory
            }
          }
        });
      } else {
        setError('Failed to create project. Please try again.');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('An error occurred while creating the project.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Add Project
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={navigateToProductSelection}
                fullWidth
              >
                Select Fabric from Products
              </Button>
            </Grid>

            {formData.fabricImageUrl && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selected Fabric:
                  </Typography>
                  <Box
                    component="img"
                    src={formData.fabricImageUrl}
                    alt="Selected fabric"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                type="submit"
                disabled={loading || !formData.fabricImageUrl}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
              >
                {loading ? 'Saving...' : 'Start Designing'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddProject; 