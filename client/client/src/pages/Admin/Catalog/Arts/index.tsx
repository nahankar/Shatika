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
  CircularProgress,
  Alert,
  Tooltip,
  Card,
  CardMedia
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { artsAPI, productsAPI } from '../../../../services/api';

// Add API base URL for images
const API_BASE_URL = 'http://localhost:5001'; // Make sure this matches your backend server
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjxwYXRoIGQ9Ik04NSA3MGgyNXYyNUg4NXoiIGZpbGw9IiM5OTkiLz48cGF0aCBkPSJNNzAgODB2NDBsNjAgLTQweiIgZmlsbD0iIzk5OSIvPjwvc3ZnPg==';

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return PLACEHOLDER_IMAGE;
  // Handle blob URLs and data URLs
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) return imageUrl;
  // Handle full URLs
  if (imageUrl.startsWith('http')) return imageUrl;
  // Handle relative paths
  return `${API_BASE_URL}${imageUrl}`;
};

// Helper function to get preview image URL - separate from server image URL handling
const getPreviewImageUrl = (previewUrl: string | null, editingArt: Art | null): string => {
  if (previewUrl) return previewUrl; // Use blob URL directly for new uploads
  if (editingArt?.imageUrl) return getFullImageUrl(editingArt.imageUrl); // Use server URL for existing images
  return PLACEHOLDER_IMAGE; // Fallback to placeholder
};

// Updated interface to match backend
interface Art {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  art: string; // ID of the associated art
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const ArtsManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [arts, setArts] = useState<Art[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArt, setEditingArt] = useState<Art | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<{ artId: string; message: string } | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const fetchArts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await artsAPI.getAll();
      console.log('Fetched arts response:', response.data);
      const apiData: ApiResponse<Art[]> = response.data;
      if (apiData.success && Array.isArray(apiData.data)) {
        setArts(apiData.data);
      } else {
        throw new Error(apiData.message || 'Invalid arts data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load arts';
      setError(errorMessage);
      setArts([]);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArts();
    return () => {
      if (previewUrl && !previewUrl.startsWith('http')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    if (previewUrl && !previewUrl.startsWith('http')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setEditingArt(null);
  };

  const handleOpenDialog = (art?: Art) => {
    if (art) {
      setEditingArt(art);
      setFormData({
        name: art.name,
        description: art.description,
      });
      setPreviewUrl(art.imageUrl);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Validate file size immediately on selection
      if (file.size > MAX_FILE_SIZE) {
        enqueueSnackbar(`File size must be less than 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`, { 
          variant: 'warning',
          autoHideDuration: 5000
        });
        event.target.value = ''; // Clear the file input
        return;
      }

      // Validate file type immediately on selection
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        enqueueSnackbar(`Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP. Selected: ${file.type}`, { 
          variant: 'warning',
          autoHideDuration: 5000
        });
        event.target.value = ''; // Clear the file input
        return;
      }

      setSelectedFile(file);
      
      // Clean up old preview URL if it exists
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // Create new preview URL
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);

      // Show file info
      enqueueSnackbar(`Selected file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`, { 
        variant: 'info',
        autoHideDuration: 3000
      });
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (!selectedFile && !editingArt) {
      errors.push('Image is required');
    }

    // Validate file size (max 10MB)
    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      errors.push(`Image size must be less than 10MB. Current size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
    }

    // Validate file type
    if (selectedFile && !ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      errors.push(`Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP. Selected: ${selectedFile.type}`);
    }

    if (errors.length > 0) {
      errors.forEach(error => enqueueSnackbar(error, { variant: 'error' }));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
        // Add file metadata to help with debugging
        formDataToSend.append('fileSize', selectedFile.size.toString());
        formDataToSend.append('fileType', selectedFile.type);
      }

      // Log the form data being sent
      console.log('Submitting form data:', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        file: selectedFile ? {
          name: selectedFile.name,
          type: selectedFile.type,
          size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`
        } : 'No file'
      });

      const response = editingArt
        ? await artsAPI.update(editingArt._id, formDataToSend)
        : await artsAPI.create(formDataToSend);

      if (response.data.success) {
        console.log('API Response:', response.data);
        enqueueSnackbar(response.data.message || 'Operation successful', { variant: 'success' });
        handleCloseDialog();
        fetchArts();
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error submitting art:', error);
      let errorMessage = 'Failed to save art';
      let errorDetails = '';
      
      if (error instanceof Error) {
        // Enhanced error handling with more specific messages
        if (error.message.includes('500')) {
          const errorResponse = (error as any).response?.data;
          errorMessage = 'Server error occurred while saving the art.';
          errorDetails = `
            Error Details:
            - Status: 500 Internal Server Error
            - Message: ${errorResponse?.message || error.message}
            - File Info: ${selectedFile ? `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)` : 'No file'}
            
            Please try:
            1. Check if the file size is within limits
            2. Ensure the file format is supported
            3. Try a different image if the issue persists
            4. Contact support if the problem continues
          `;
          console.error('Server Error Details:', {
            error,
            response: (error as any).response?.data,
            request: {
              name: formData.name,
              description: formData.description,
              file: selectedFile ? {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size
              } : null
            }
          });
        } else if (error.message.includes('413')) {
          errorMessage = `Image file is too large. Maximum size: 10MB. Current size: ${selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0}MB`;
        } else if (error.message.includes('415')) {
          errorMessage = `Invalid file type: ${selectedFile?.type}. Allowed formats: JPEG, PNG, GIF, WEBP.`;
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      enqueueSnackbar(errorMessage, { 
        variant: 'error',
        autoHideDuration: 8000,
        action: (key) => (
          <Box>
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                // Show detailed error dialog
                enqueueSnackbar(errorDetails || 'No additional details available', {
                  variant: 'info',
                  autoHideDuration: 15000,
                  action: (key) => (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        // Copy error details to clipboard
                        navigator.clipboard.writeText(errorDetails);
                        enqueueSnackbar('Error details copied to clipboard', {
                          variant: 'success',
                          autoHideDuration: 2000
                        });
                      }}
                    >
                      Copy Details
                    </Button>
                  )
                });
              }}
            >
              Show Details
            </Button>
            {selectedFile && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setSelectedFile(null);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                  enqueueSnackbar('Image cleared. Try uploading a different image.', {
                    variant: 'info',
                    autoHideDuration: 4000
                  });
                }}
                sx={{ ml: 1 }}
              >
                Clear Image
              </Button>
            )}
          </Box>
        )
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this art?')) return;
    
    try {
      setDeleteError(null); // Clear any previous error
      const response = await artsAPI.delete(id);
      if (response.data.success) {
        enqueueSnackbar(response.data.message || 'Art deleted successfully', { variant: 'success' });
        fetchArts();
      } else {
        throw new Error(response.data.message || 'Failed to delete art');
      }
    } catch (error) {
      let errorMessage = 'Failed to delete art';
      
      // Check if the error is due to product references
      if (error instanceof Error && 
          error.message.includes('being used by existing products')) {
        errorMessage = 'This art cannot be deleted because it is being used by existing products.';
        setDeleteError({ artId: id, message: errorMessage });
        
        // Fetch related products
        try {
          const response = await productsAPI.getAll();
          const products = response.data.data.filter((p: Product) => p.art === id);
          
          if (products && products.length > 0) {
            const productsList = products
              .map((product: Product) => product.name)
              .join(', ');
            setDeleteError({ 
              artId: id, 
              message: `This art is being used by the following products: ${productsList}. Please remove these product references before deleting.`
            });
          }
        } catch (err) {
          console.error('Error fetching related products:', err);
        }
      } else {
        errorMessage = error instanceof Error ? error.message : 'Failed to delete art';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <>
        {deleteError && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  window.location.href = '/admin/catalog/products';
                }}
              >
                Go to Products
              </Button>
            }
          >
            {deleteError.message}
          </Alert>
        )}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(arts) && arts.length > 0 ? (
                arts.map((art: Art) => (
                  <TableRow 
                    key={art._id}
                    sx={deleteError?.artId === art._id ? { 
                      backgroundColor: 'warning.light',
                      '& td': { color: 'warning.dark' }
                    } : {}}
                  >
                    <TableCell>
                      <Card sx={{ width: 100, height: 100 }}>
                        <CardMedia
                          component="img"
                          height="100"
                          image={getFullImageUrl(art.imageUrl)}
                          alt={art.name}
                          sx={{ 
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%',
                            bgcolor: 'grey.100'
                          }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            const target = e.currentTarget;
                            console.error('Image load error:', target.src);
                            if (target.src !== PLACEHOLDER_IMAGE) {
                              target.src = PLACEHOLDER_IMAGE;
                              // Prevent infinite error loop if placeholder also fails
                              target.onerror = null;
                            }
                          }}
                        />
                      </Card>
                    </TableCell>
                    <TableCell>{art.name}</TableCell>
                    <TableCell>{art.description}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(art)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(art._id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No arts available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Arts Management</Typography>
        <Tooltip title="Add New Art">
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
        </Tooltip>
      </Box>

      {renderContent()}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { overflowY: 'visible' }
        }}
      >
        <DialogTitle>
          {editingArt ? 'Edit Art' : 'Add New Art'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              margin="normal"
              error={formData.name.trim() === ''}
              helperText={formData.name.trim() === '' ? 'Name is required' : ''}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              margin="normal"
              multiline
              rows={4}
              error={formData.description.trim() === ''}
              helperText={formData.description.trim() === '' ? 'Description is required' : ''}
            />

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2 }}
            >
              {selectedFile ? 'Change Image' : (editingArt ? 'Change Image' : 'Upload Image')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>

            {/* Image Preview */}
            {(previewUrl || editingArt) && (
              <Box mt={2} display="flex" flexDirection="column" alignItems="center">
                <Typography variant="subtitle1" gutterBottom>
                  Image Preview:
                </Typography>
                <Card sx={{ width: 200, height: 200, mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getPreviewImageUrl(previewUrl, editingArt)}
                    alt="Preview"
                    sx={{ 
                      objectFit: 'cover',
                      bgcolor: 'grey.100'
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.currentTarget;
                      console.error('Preview image load error:', target.src);
                      if (target.src !== PLACEHOLDER_IMAGE) {
                        target.src = PLACEHOLDER_IMAGE;
                        target.onerror = null; // Prevent infinite error loop
                      }
                    }}
                  />
                </Card>
                {selectedFile && (
                  <Typography variant="caption" color="textSecondary">
                    Selected file: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : (
              editingArt ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArtsManagement; 