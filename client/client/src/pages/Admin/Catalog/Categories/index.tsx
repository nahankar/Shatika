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
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { categoriesAPI } from '../../../../services/api';

interface Category {
  _id: string;
  name: string;
}

const CategoriesManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        enqueueSnackbar(response.data.message || 'Error fetching categories', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      enqueueSnackbar('Error fetching categories', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSubmit = async () => {
    try {
      if (!categoryName.trim()) {
        enqueueSnackbar('Category name is required', { variant: 'error' });
        return;
      }

      let response;
      if (editingCategory) {
        response = await categoriesAPI.update(editingCategory._id, categoryName);
      } else {
        response = await categoriesAPI.create(categoryName);
      }

      if (response.data.success) {
        enqueueSnackbar(
          editingCategory ? 'Category updated successfully' : 'Category created successfully',
          { variant: 'success' }
        );
        handleCloseDialog();
        fetchCategories();
      } else {
        enqueueSnackbar(response.data.message || 'Operation failed', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error submitting category:', error);
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const response = await categoriesAPI.delete(id);
      if (response.data.success) {
        enqueueSnackbar('Category deleted successfully', { variant: 'success' });
        fetchCategories();
      } else {
        enqueueSnackbar(response.data.message || 'Failed to delete category', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      enqueueSnackbar('Failed to delete category', { variant: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Categories Management</Typography>
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
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category._id}>
                <TableCell>{category.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(category)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesManagement; 