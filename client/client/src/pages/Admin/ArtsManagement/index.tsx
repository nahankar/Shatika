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
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { artsAPI } from '../../../services/api';

interface Art {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
}

const ArtsManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [arts, setArts] = useState<Art[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArt, setEditingArt] = useState<Art | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });
  const [imageUploadMethod, setImageUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArts();
  }, []);

  const fetchArts = async () => {
    try {
      setLoading(true);
      console.log('Fetching arts...');
      const response = await artsAPI.getAll();
      console.log('Arts API Raw Response:', response);
      
      let artsData;
      if (response.data?.success && Array.isArray(response.data.data)) {
        console.log('Using success.data format');
        artsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('Using direct array format');
        artsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('Using nested data format');
        artsData = response.data.data;
      } else {
        console.log('Unexpected data format:', response.data);
        artsData = [];
      }
      
      console.log('Final Processed Arts Data:', artsData);
      
      if (artsData.length === 0) {
        console.log('No arts data found in response');
        enqueueSnackbar('No arts found', { variant: 'info' });
      }
      
      setArts(artsData);
    } catch (error: any) {
      console.error('Error fetching arts:', error);
      console.error('Full error object:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      enqueueSnackbar(
        error.response?.data?.message || error.message || 'Error fetching arts', 
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (art?: Art) => {
    if (art) {
      setEditingArt(art);
      setFormData({
        name: art.name,
        description: art.description,
        imageUrl: art.imageUrl || '',
      });
      setImageUploadMethod('url');
    } else {
      setEditingArt(null);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
      });
      setImageUploadMethod('url');
    }
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingArt(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
    });
    setSelectedFile(null);
    setImageUploadMethod('url');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        enqueueSnackbar('Name is required', { variant: 'error' });
        return;
      }

      if (imageUploadMethod === 'url' && !formData.imageUrl.trim()) {
        enqueueSnackbar('Image URL is required', { variant: 'error' });
        return;
      }

      if (imageUploadMethod === 'file' && !selectedFile && !editingArt) {
        enqueueSnackbar('Image file is required', { variant: 'error' });
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      
      if (imageUploadMethod === 'url') {
        formDataToSend.append('imageUrl', formData.imageUrl);
      } else if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      let response;
      if (editingArt) {
        response = await artsAPI.update(editingArt._id, formDataToSend);
      } else {
        response = await artsAPI.create(formDataToSend);
      }

      if (response.data.success) {
        enqueueSnackbar(
          editingArt ? 'Art updated successfully' : 'Art created successfully',
          { variant: 'success' }
        );
        handleCloseDialog();
        fetchArts();
      } else {
        enqueueSnackbar(response.data.message || 'Operation failed', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this art?')) {
      try {
        const response = await artsAPI.delete(id);
        if (response.data.success) {
          enqueueSnackbar('Art deleted successfully', { variant: 'success' });
          fetchArts();
        } else {
          enqueueSnackbar(response.data.message || 'Failed to delete art', { variant: 'error' });
        }
      } catch (error: any) {
        console.error('Error deleting art:', error);
        enqueueSnackbar(error.response?.data?.message || 'Failed to delete art', { variant: 'error' });
      }
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Arts Management</Typography>
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

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {arts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body1">No arts found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                arts.map((art) => (
                  <TableRow key={art._id}>
                    <TableCell>{art.name}</TableCell>
                    <TableCell>{art.description}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenDialog(art)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(art._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingArt ? 'Edit Art' : 'Add New Art'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
              required
            />
            
            <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
              <FormLabel component="legend">Image Upload Method</FormLabel>
              <RadioGroup
                row
                value={imageUploadMethod}
                onChange={(e) => setImageUploadMethod(e.target.value as 'url' | 'file')}
              >
                <FormControlLabel value="url" control={<Radio />} label="Image URL" />
                <FormControlLabel value="file" control={<Radio />} label="Upload File" />
              </RadioGroup>
            </FormControl>

            {imageUploadMethod === 'url' ? (
              <TextField
                fullWidth
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                margin="normal"
                required
                helperText="Enter a valid image URL"
              />
            ) : (
              <Box sx={{ mt: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="image-file-input">
                  <Button variant="contained" component="span">
                    Choose Image
                  </Button>
                </label>
                {selectedFile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected file: {selectedFile.name}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingArt ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArtsManagement; 