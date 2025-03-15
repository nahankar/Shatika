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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { homeSectionsAPI } from '../../../services/api';

interface HomeSection {
  _id: string;
  type: 'category' | 'art';
  name: string;
  displayOrder: number;
  image: string;
  isActive: boolean;
}

const HomeSectionsManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'category',
    name: '',
    displayOrder: 0,
    isActive: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await homeSectionsAPI.getAll();
      if (response.data.success) {
        setSections(response.data.data);
      } else {
        enqueueSnackbar(response.data.message || 'Error fetching sections', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      enqueueSnackbar(error.response?.data?.message || 'Error fetching sections', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (section?: HomeSection) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        type: section.type,
        name: section.name,
        displayOrder: section.displayOrder,
        isActive: section.isActive,
      });
      setImagePreview(section.image);
    } else {
      setEditingSection(null);
      setFormData({
        type: 'category',
        name: '',
        displayOrder: sections.length,
        isActive: true,
      });
      setImagePreview('');
    }
    setSelectedImage(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSection(null);
    setFormData({
      type: 'category',
      name: '',
      displayOrder: 0,
      isActive: true,
    });
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      isActive: e.target.checked
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('displayOrder', formData.displayOrder.toString());
      formDataToSend.append('isActive', formData.isActive.toString());
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      let response;
      if (editingSection) {
        response = await homeSectionsAPI.update(editingSection._id, formDataToSend);
      } else {
        response = await homeSectionsAPI.create(formDataToSend);
      }

      if (response.data.success) {
        enqueueSnackbar(
          editingSection
            ? 'Section updated successfully'
            : 'Section created successfully',
          { variant: 'success' }
        );
        setOpenDialog(false);
        fetchSections();
      } else {
        enqueueSnackbar(response.data.message || 'Operation failed', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        const response = await homeSectionsAPI.delete(id);
        if (response.data.success) {
          enqueueSnackbar('Section deleted successfully', { variant: 'success' });
          fetchSections();
        } else {
          enqueueSnackbar(response.data.message || 'Failed to delete section', { variant: 'error' });
        }
      } catch (error: any) {
        console.error('Error deleting section:', error);
        enqueueSnackbar(error.response?.data?.message || 'Failed to delete section', { variant: 'error' });
      }
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Home Sections Management</Typography>
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
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Display Order</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((section) => (
              <TableRow key={section._id}>
                <TableCell>{section.type}</TableCell>
                <TableCell>{section.name}</TableCell>
                <TableCell>{section.displayOrder}</TableCell>
                <TableCell>
                  <Box
                    component="img"
                    src={section.image}
                    alt={section.name}
                    sx={{ width: 50, height: 50, objectFit: 'cover' }}
                  />
                </TableCell>
                <TableCell>
                  {section.isActive ? 'Active' : 'Inactive'}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(section)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(section._id)} color="error">
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
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="type"
                label="Type"
                select
                fullWidth
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="art">Art</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="displayOrder"
                label="Display Order"
                type="number"
                fullWidth
                value={formData.displayOrder}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleSwitchChange}
                    name="isActive"
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <input
                accept="image/*"
                type="file"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="section-image"
              />
              <label htmlFor="section-image">
                <Button variant="outlined" component="span" fullWidth>
                  Upload Image
                </Button>
              </label>
            </Grid>
            {imagePreview && (
              <Grid item xs={12}>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: 200,
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 1,
                  }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomeSectionsManagement; 