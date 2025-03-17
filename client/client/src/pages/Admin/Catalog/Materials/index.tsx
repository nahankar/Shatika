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
import { materialsAPI } from '../../../../services/api';

interface Material {
  _id: string;
  name: string;
}

const MaterialsManagement: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialsAPI.getAll();
      if (response.data.success) {
        setMaterials(response.data.data);
      } else {
        enqueueSnackbar(response.data.message || 'Error fetching materials', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      enqueueSnackbar('Error fetching materials', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setMaterialName(material.name);
    } else {
      setEditingMaterial(null);
      setMaterialName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMaterial(null);
    setMaterialName('');
  };

  const handleSubmit = async () => {
    try {
      if (!materialName.trim()) {
        enqueueSnackbar('Material name is required', { variant: 'error' });
        return;
      }

      let response;
      if (editingMaterial) {
        response = await materialsAPI.update(editingMaterial._id, materialName);
      } else {
        response = await materialsAPI.create(materialName);
      }

      if (response.data.success) {
        enqueueSnackbar(
          editingMaterial ? 'Material updated successfully' : 'Material created successfully',
          { variant: 'success' }
        );
        handleCloseDialog();
        fetchMaterials();
      } else {
        enqueueSnackbar(response.data.message || 'Operation failed', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error submitting material:', error);
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const response = await materialsAPI.delete(id);
      if (response.data.success) {
        enqueueSnackbar('Material deleted successfully', { variant: 'success' });
        fetchMaterials();
      } else {
        enqueueSnackbar(response.data.message || 'Failed to delete material', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      enqueueSnackbar('Failed to delete material', { variant: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Materials Management</Typography>
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
            {materials.map((material) => (
              <TableRow key={material._id}>
                <TableCell>{material.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(material)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(material._id)} color="error">
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
          {editingMaterial ? 'Edit Material' : 'Add New Material'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Material Name"
            fullWidth
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingMaterial ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialsManagement; 