import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { productsAPI, categoriesAPI, materialsAPI, artsAPI } from '../../../../services/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: {
    _id: string;
    name: string;
  };
  material: {
    _id: string;
    name: string;
  };
  art: {
    _id: string;
    name: string;
  };
  images: string[];
  isActive: boolean;
  showInDIY: boolean;
}

interface Category {
  _id: string;
  name: string;
}

interface Material {
  _id: string;
  name: string;
}

interface Art {
  _id: string;
  name: string;
}

const ProductsManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [arts, setArts] = useState<Art[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    material: '',
    art: '',
    isActive: true,
    showInDIY: false,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchMaterials();
    fetchArts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      console.log('Fetched products:', response.data);
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        enqueueSnackbar(response.data.message || 'Error fetching products', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      enqueueSnackbar('Error fetching products', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      enqueueSnackbar('Error fetching categories', { variant: 'error' });
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await materialsAPI.getAll();
      setMaterials(response.data.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
      enqueueSnackbar('Error fetching materials', { variant: 'error' });
    }
  };

  const fetchArts = async () => {
    try {
      const response = await artsAPI.getAll();
      if (response.data.success) {
        setArts(response.data.data);
      } else {
        enqueueSnackbar(response.data.message || 'Error fetching arts', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching arts:', error);
      enqueueSnackbar('Error fetching arts', { variant: 'error' });
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category?._id || '',
        material: product.material?._id || '',
        art: product.art?._id || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
        showInDIY: product.showInDIY !== undefined ? product.showInDIY : false,
      });
      setImagePreviews(product.images);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        material: '',
        art: '',
        isActive: true,
        showInDIY: false,
      });
      setImagePreviews([]);
    }
    setImages([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      material: '',
      art: '',
      isActive: true,
      showInDIY: false,
    });
    setImages([]);
    setImagePreviews([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | boolean } }
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        enqueueSnackbar('Product name is required', { variant: 'error' });
        return;
      }
      if (!formData.description.trim()) {
        enqueueSnackbar('Description is required', { variant: 'error' });
        return;
      }
      if (!formData.price || isNaN(Number(formData.price))) {
        enqueueSnackbar('Valid price is required', { variant: 'error' });
        return;
      }
      if (!formData.category) {
        enqueueSnackbar('Category is required', { variant: 'error' });
        return;
      }
      if (!formData.material) {
        enqueueSnackbar('Material is required', { variant: 'error' });
        return;
      }
      if (!formData.art) {
        enqueueSnackbar('Art is required', { variant: 'error' });
        return;
      }
      if (!editingProduct && (!images.length || images.length === 0)) {
        enqueueSnackbar('At least one image is required', { variant: 'error' });
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('material', formData.material);
      formDataToSend.append('art', formData.art);
      formDataToSend.append('isActive', String(formData.isActive));
      formDataToSend.append('showInDIY', String(formData.showInDIY));

      // Add new images if any
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      // Add existing images if editing
      if (editingProduct) {
        formDataToSend.append('existingImages', JSON.stringify(editingProduct.images));
      }

      console.log('Submitting form data:', {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        material: formData.material,
        art: formData.art,
        isActive: formData.isActive,
        showInDIY: formData.showInDIY,
        newImages: images.length,
        existingImages: editingProduct?.images?.length || 0
      });

      try {
        let response;
        if (editingProduct) {
          console.log('Updating product:', editingProduct._id);
          response = await productsAPI.update(editingProduct._id, formDataToSend);
        } else {
          console.log('Creating new product');
          response = await productsAPI.create(formDataToSend);
        }

        console.log('API Response:', response);

        if (response.data.success) {
          enqueueSnackbar(
            editingProduct ? 'Product updated successfully' : 'Product created successfully',
            { variant: 'success' }
          );
          handleCloseDialog();
          fetchProducts();
        } else {
          enqueueSnackbar(response.data.message || 'Operation failed', { variant: 'error' });
        }
      } catch (error: any) {
        console.error('API error:', error);
        enqueueSnackbar(error.message || 'Operation failed', { variant: 'error' });
      }
    } catch (error) {
      console.error('Operation error:', error);
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await productsAPI.delete(id);
      if (response.data.success) {
        enqueueSnackbar('Product deleted successfully', { variant: 'success' });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      enqueueSnackbar('Error deleting product', { variant: 'error' });
    }
  };

  // Function to handle toggle state changes directly from the table
  const handleToggleStatus = async (id: string, field: 'isActive' | 'showInDIY', value: boolean) => {
    try {
      // Find the product to update
      const productToUpdate = products.find(p => p._id === id);
      if (!productToUpdate) return;

      // Create a FormData object with the minimal data needed for update
      const formDataToSend = new FormData();
      formDataToSend.append('name', productToUpdate.name);
      formDataToSend.append('description', productToUpdate.description);
      formDataToSend.append('price', productToUpdate.price.toString());
      formDataToSend.append('category', productToUpdate.category._id);
      formDataToSend.append('material', productToUpdate.material._id);
      formDataToSend.append('art', productToUpdate.art._id);
      
      // Add existing images if any
      if (productToUpdate.images && productToUpdate.images.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(productToUpdate.images));
      }

      // Set the value we're updating
      if (field === 'isActive') {
        formDataToSend.append('isActive', String(value));
        formDataToSend.append('showInDIY', String(productToUpdate.showInDIY));
      } else {
        formDataToSend.append('showInDIY', String(value));
        formDataToSend.append('isActive', String(productToUpdate.isActive));
      }

      // Update the product
      const response = await productsAPI.update(id, formDataToSend);

      if (response.data.success) {
        // Update the local state to reflect the change
        setProducts(products.map(p => 
          p._id === id ? { ...p, [field]: value } : p
        ));
        enqueueSnackbar(`Product ${field === 'isActive' ? 'status' : 'DIY visibility'} updated`, { variant: 'success' });
      } else {
        enqueueSnackbar(response.data.message || 'Failed to update product', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      enqueueSnackbar('Error updating product', { variant: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Products Management</Typography>
        <IconButton
          color="primary"
          onClick={() => handleOpenDialog()}
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Material</TableCell>
              <TableCell>Art</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="center">Show in DIY</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.category?.name || 'N/A'}</TableCell>
                <TableCell>{product.material?.name || 'N/A'}</TableCell>
                <TableCell>{product.art?.name || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Tooltip title={product.isActive ? "Active - Visible to users" : "Inactive - Hidden from users"}>
                    <Switch
                      checked={product.isActive !== undefined ? product.isActive : true}
                      onChange={(e) => handleToggleStatus(product._id, 'isActive', e.target.checked)}
                      color="primary"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={product.showInDIY ? "Shown in DIY projects" : "Hidden from DIY projects"}>
                    <Switch
                      checked={product.showInDIY !== undefined ? product.showInDIY : false}
                      onChange={(e) => handleToggleStatus(product._id, 'showInDIY', e.target.checked)}
                      color="secondary"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(product)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(product._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Product Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="price"
                label="Price"
                type="number"
                fullWidth
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="category"
                label="Category"
                select
                fullWidth
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="material"
                label="Material"
                select
                fullWidth
                value={formData.material}
                onChange={handleInputChange}
                required
              >
                {materials.map((material) => (
                  <MenuItem key={material._id} value={material._id}>
                    {material.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="art"
                label="Art"
                select
                fullWidth
                value={formData.art}
                onChange={handleInputChange}
                required
              >
                {arts.map((art) => (
                  <MenuItem key={art._id} value={art._id}>
                    {art.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange({
                      target: { name: 'isActive', value: e.target.checked }
                    })}
                    color="primary"
                  />
                }
                label="Active (Visible to users)"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    name="showInDIY"
                    checked={formData.showInDIY}
                    onChange={(e) => handleInputChange({
                      target: { name: 'showInDIY', value: e.target.checked }
                    })}
                    color="secondary"
                  />
                }
                label="Show in DIY Projects"
              />
            </Grid>
            <Grid item xs={12}>
              <input
                accept="image/*"
                type="file"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="product-images"
              />
              <label htmlFor="product-images">
                <Button variant="outlined" component="span" fullWidth>
                  Upload Images
                </Button>
              </label>
            </Grid>
            {imagePreviews.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {imagePreviews.map((preview, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={preview}
                      sx={{
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsManagement; 